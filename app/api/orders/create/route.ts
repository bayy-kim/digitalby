import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createIPaymuQRIS } from '@/lib/ipaymu'
import { sendTelegramOrderNotification } from '@/lib/telegram'
import { z } from 'zod'

const createOrderSchema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().min(2).max(100).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().max(20).optional().or(z.literal('')),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Input tidak valid', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { productId, customerName, customerEmail, customerPhone } = parsed.data

    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan atau sedang tidak aktif' },
        { status: 404 }
      )
    }

    // Check Stock
    if (product.stock <= 0) {
      return NextResponse.json(
        { error: 'Maaf, stok produk ini telah habis (SOLD OUT)' },
        { status: 400 }
      )
    }

    // Set expiration 24 hours from now
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Create Order with PENDING status
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        amount: product.price,
        status: 'PENDING',
        customerName: customerName || 'Pembeli Digital',
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        expiredAt,
      },
    })

    // Send Telegram Notification to Admin with 1-Click Approve Button
    sendTelegramOrderNotification({
      orderId: order.id,
      productTitle: product.title,
      amount: product.price,
      customerName: customerName || 'Pembeli Digital',
      customerEmail,
      customerPhone,
      createdAt: order.createdAt,
    }).catch((err) => console.error('Telegram notification bg error:', err))

    // Construct origin URL for callbacks
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const notifyUrl = `${origin}/api/webhook/ipaymu`
    const returnUrl = `${origin}/order/${order.id}`
    const cancelUrl = `${origin}/checkout/${order.id}`

    // Request QRIS via iPaymu Payment Direct API
    let qrisUrl: string | null = null
    let trxId: string | null = null

    try {
      const ipaymuRes = await createIPaymuQRIS({
        name: customerName || 'Pembeli Digital Store',
        email: customerEmail || undefined,
        phone: customerPhone || undefined,
        amount: product.price,
        referenceId: order.id,
        notifyUrl,
        returnUrl,
        cancelUrl,
        productName: product.title,
      })

      if (ipaymuRes.Success && ipaymuRes.Data) {
        qrisUrl = ipaymuRes.Data.QrImage || ipaymuRes.Data.Url || ipaymuRes.Data.QrString || null
        trxId = String(ipaymuRes.Data.TransactionId)
      }
    } catch (ipaymuErr) {
      console.warn('iPaymu integration notice:', ipaymuErr)
    }

    // Update order with iPaymu trxId & qrisUrl if available
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        ipaymuTrxId: trxId,
        qrisUrl: qrisUrl,
      },
    })

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      amount: updatedOrder.amount,
      qrisUrl: updatedOrder.qrisUrl,
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat membuat pesanan' },
      { status: 500 }
    )
  }
}
