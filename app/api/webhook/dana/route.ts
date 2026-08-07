import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    let rawText = ''
    let secret = ''
    let amountParsed = 0

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      rawText = body.text || body.message || body.body || JSON.stringify(body)
      secret = body.secret || body.token || request.headers.get('x-dana-secret') || ''
      if (body.amount) {
        amountParsed = parseInt(String(body.amount), 10)
      }
    } else {
      rawText = await request.text()
      secret = request.headers.get('x-dana-secret') || ''
    }

    // Optional Secret Token Verification if DANA_WEBHOOK_SECRET is configured
    const configuredSecret = process.env.DANA_WEBHOOK_SECRET
    if (configuredSecret && secret !== configuredSecret) {
      const authHeader = request.headers.get('authorization') || ''
      if (!authHeader.includes(configuredSecret)) {
        return NextResponse.json({ error: 'Unauthorized secret token' }, { status: 401 })
      }
    }

    // Log raw notification into WebhookLog
    await prisma.webhookLog.create({
      data: {
        provider: 'dana_android_notification',
        rawPayload: { rawText, secretReceived: secret },
        isValid: true,
      },
    })

    // Extract amount from text if not explicitly provided (e.g. "Terima Rp 25.000", "Rp 25.000", "25000")
    if (!amountParsed && rawText) {
      const cleaned = rawText.replace(/\./g, '').replace(/,/g, '')
      const match = cleaned.match(/Rp\s*(\d+)/i) || cleaned.match(/(\d{4,9})/)
      if (match && match[1]) {
        amountParsed = parseInt(match[1], 10)
      }
    }

    if (!amountParsed || isNaN(amountParsed)) {
      console.warn('DANA Webhook: Could not parse nominal amount from notification text:', rawText)
      return NextResponse.json({ message: 'Notification received but no valid amount found' }, { status: 200 })
    }

    // Find the oldest PENDING order matching this exact amount
    const order = await prisma.order.findFirst({
      where: {
        amount: amountParsed,
        status: 'PENDING',
        expiredAt: { gt: new Date() },
      },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    })

    if (!order) {
      console.warn(`DANA Webhook: No matching PENDING order found for amount Rp ${amountParsed}`)
      return NextResponse.json({ message: `No pending order found for Rp ${amountParsed}` }, { status: 200 })
    }

    // Update order status to PAID
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID' },
    })

    // Decrement stock if stock > 0
    if (order.product && order.product.stock > 0) {
      await prisma.product.update({
        where: { id: order.product.id },
        data: { stock: { decrement: 1 } },
      })
    }

    // Generate Download Token
    const downloadTokenStr = crypto.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.downloadToken.create({
      data: {
        token: downloadTokenStr,
        orderId: order.id,
        expiresAt: tokenExpiresAt,
        maxUses: 5,
      },
    })

    // Record AuditLog
    await prisma.auditLog.create({
      data: {
        actor: 'DANA_ANDROID_BOT',
        action: 'DANA_AUTO_FULFILL_ORDER',
        detail: `Auto-fulfill order ${order.id} untuk nominal Rp ${amountParsed} dari notifikasi DANA HP`,
        ipAddress: request.headers.get('x-forwarded-for') || 'ANDROID_APP',
      },
    })

    console.log(`DANA Auto-Fulfill SUCCESS: Order ${order.id} marked as PAID for amount Rp ${amountParsed}`)

    return NextResponse.json({
      success: true,
      message: `Order ${order.id} marked as PAID`,
      orderId: order.id,
      amount: amountParsed,
    })
  } catch (error) {
    console.error('Error handling DANA notification webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
