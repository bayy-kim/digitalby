import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createIPaymuQRIS } from '@/lib/ipaymu'
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

    // Construct origin URL for callbacks
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const notifyUrl = `${origin}/api/webhook/ipaymu`
    const returnUrl = `${origin}/order/${order.id}`
    const cancelUrl = `${origin}/checkout/${order.id}`

    // Request QRIS via iPaymu Payment Direct API
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

    if (!ipaymuRes.Success || !ipaymuRes.Data) {
      console.error('iPaymu error response:', ipaymuRes)
      return NextResponse.json(
        { error: ipaymuRes.Message || 'Gagal memproses pembayaran QRIS ke iPaymu' },
        { status: 500 }
      )
    }

    const qrisUrl = ipaymuRes.Data.QrImage || ipaymuRes.Data.Url || ipaymuRes.Data.QrString
    const trxId = String(ipaymuRes.Data.TransactionId)

    // Update order with iPaymu trxId & qrisUrl
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        ipaymuTrxId: trxId,
        qrisUrl: qrisUrl || null,
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
