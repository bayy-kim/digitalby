import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkIPaymuTransactionStatus } from '@/lib/ipaymu'
import crypto from 'crypto'

export async function POST(request: Request) {
  let rawBody: any = null
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      rawBody = await request.json()
    } else {
      const text = await request.text()
      const params = new URLSearchParams(text)
      rawBody = Object.fromEntries(params.entries())
    }
  } catch (e) {
    rawBody = { error: 'Failed to parse body' }
  }

  // Always log raw webhook payload
  await prisma.webhookLog.create({
    data: {
      provider: 'ipaymu',
      rawPayload: rawBody || {},
      isValid: true,
    },
  })

  try {
    const trxId = rawBody?.trx_id || rawBody?.transaction_id || rawBody?.sid || rawBody?.reference_id
    const referenceId = rawBody?.reference_id || rawBody?.referenceId

    if (!trxId && !referenceId) {
      return NextResponse.json({ message: 'Missing transaction/reference ID' }, { status: 400 })
    }

    // Locate order in database
    let order = null
    if (referenceId) {
      order = await prisma.order.findUnique({
        where: { id: String(referenceId) },
        include: { product: true },
      })
    }

    if (!order && trxId) {
      order = await prisma.order.findFirst({
        where: { ipaymuTrxId: String(trxId) },
        include: { product: true },
      })
    }

    if (!order) {
      console.warn(`Order not found for webhook: trxId=${trxId}, referenceId=${referenceId}`)
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Idempotency: if order is already PAID, skip processing
    if (order.status === 'PAID') {
      return NextResponse.json({ message: 'Order already processed as PAID' }, { status: 200 })
    }

    // Server-to-server DOUBLE-CHECK to iPaymu status API (never trust payload alone)
    const targetTrxId = order.ipaymuTrxId || trxId
    const checkRes = await checkIPaymuTransactionStatus(targetTrxId)

    if (!checkRes.Success || !checkRes.Data) {
      console.error('Server-to-server check failed with iPaymu:', checkRes)
      return NextResponse.json({ message: 'Verification failed' }, { status: 400 })
    }

    const { Status: remoteStatus, Amount: remoteAmount } = checkRes.Data

    // Security check: Amount MUST match exactly
    if (remoteAmount !== order.amount) {
      console.error(`Fraud alert: Amount mismatch for order ${order.id}. Expected ${order.amount}, got ${remoteAmount}`)
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      })
      return NextResponse.json({ message: 'Amount mismatch fraud prevented' }, { status: 400 })
    }

    // Process status update based on verified iPaymu status
    if (remoteStatus === 1) { // 1 = PAID / Success
      // Update order status to PAID
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      })

      // Decrement product stock if > 0
      if (order.product && order.product.stock > 0) {
        await prisma.product.update({
          where: { id: order.product.id },
          data: {
            stock: { decrement: 1 },
          },
        })
      }

      // Generate secure 32-byte cryptographic download token
      const downloadTokenStr = crypto.randomBytes(32).toString('hex')
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry

      await prisma.downloadToken.create({
        data: {
          token: downloadTokenStr,
          orderId: order.id,
          expiresAt: tokenExpiresAt,
          maxUses: 5,
        },
      })

      console.log(`Order ${order.id} marked as PAID. Stock decremented. Download token generated.`)
    } else if (remoteStatus === 2) { // 2 = Expired / Canceled
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'EXPIRED' },
      })
    } else if (remoteStatus === -1) { // -1 = Failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      })
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 })
  } catch (error) {
    console.error('Error handling iPaymu webhook:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
