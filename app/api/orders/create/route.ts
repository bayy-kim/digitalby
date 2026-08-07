import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createIPaymuQRIS } from '@/lib/ipaymu'
import { generateDynamicQRISImage } from '@/lib/qris-dynamic'
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

    // Generate unique sub-rupiah code (e.g. +101 to +999) for 100% precise DANA auto-matching
    const randomCode = Math.floor(Math.random() * 899) + 101
    const exactAmount = product.price + randomCode

    // Set expiration 24 hours from now
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Create Order with PENDING status & exact unique amount
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        amount: exactAmount,
        status: 'PENDING',
        customerName: customerName || 'Pembeli Digital',
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        expiredAt,
      },
    })

    // Generate Dynamic QRIS Image with exact amount locked in
    const dynamicQrisImage = await generateDynamicQRISImage(exactAmount)

    // Send Telegram Notification to Admin with 1-Click Approve Button
    sendTelegramOrderNotification({
      orderId: order.id,
      productTitle: product.title,
      amount: exactAmount,
      customerName: customerName || 'Pembeli Digital',
      customerEmail,
      customerPhone,
      createdAt: order.createdAt,
    }).catch((err) => console.error('Telegram notification bg error:', err))

    // Optional iPaymu call as fallback / production gateway
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    let ipaymuTrxId: string | null = null

    try {
      const ipaymuRes = await createIPaymuQRIS({
        name: customerName || 'Pembeli Digital Store',
        email: customerEmail || undefined,
        phone: customerPhone || undefined,
        amount: exactAmount,
        referenceId: order.id,
        notifyUrl: `${origin}/api/webhook/ipaymu`,
        returnUrl: `${origin}/order/${order.id}`,
        cancelUrl: `${origin}/checkout/${order.id}`,
        productName: product.title,
      })

      if (ipaymuRes.Success && ipaymuRes.Data) {
        ipaymuTrxId = String(ipaymuRes.Data.TransactionId)
      }
    } catch (ipaymuErr) {
      console.warn('iPaymu gateway notice:', ipaymuErr)
    }

    // Update order with dynamic QRIS Image & iPaymu TrxId
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        ipaymuTrxId: ipaymuTrxId,
        qrisUrl: dynamicQrisImage || '/qris-dana.svg',
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
