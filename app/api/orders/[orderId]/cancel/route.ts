import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (order.status === 'PAID') {
      return NextResponse.json({ error: 'Pesanan yang sudah lunas tidak dapat dibatalkan' }, { status: 400 })
    }

    // Update status to EXPIRED (Canceled)
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'EXPIRED' },
    })

    // Record AuditLog
    await prisma.auditLog.create({
      data: {
        actor: order.customerName || 'BUYER',
        action: 'CANCEL_ORDER',
        detail: `Membatalkan pesanan ${order.id}`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan',
      status: updated.status,
    })
  } catch (error) {
    console.error('Error canceling order:', error)
    return NextResponse.json(
      { error: 'Gagal membatalkan pesanan' },
      { status: 500 }
    )
  }
}
