import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkIPaymuTransactionStatus } from '@/lib/ipaymu'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        amount: true,
        qrisUrl: true,
        expiredAt: true,
        ipaymuTrxId: true,
        createdAt: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    // Check if expired based on timestamp
    if (order.status === 'PENDING' && new Date() > new Date(order.expiredAt)) {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json({ status: updated.status })
    }

    // Active server check to iPaymu if still PENDING & ipaymuTrxId exists
    if (order.status === 'PENDING' && order.ipaymuTrxId) {
      try {
        const ipaymuCheck = await checkIPaymuTransactionStatus(order.ipaymuTrxId)
        if (ipaymuCheck.Success && ipaymuCheck.Data) {
          const remoteStatus = ipaymuCheck.Data.Status
          const remoteAmount = ipaymuCheck.Data.Amount

          // Verify amount matches to prevent fraud
          if (remoteAmount === order.amount) {
            if (remoteStatus === 1) {
              const updated = await prisma.order.update({
                where: { id: orderId },
                data: { status: 'PAID' },
              })
              return NextResponse.json({ status: updated.status })
            } else if (remoteStatus === 2) {
              const updated = await prisma.order.update({
                where: { id: orderId },
                data: { status: 'EXPIRED' },
              })
              return NextResponse.json({ status: updated.status })
            } else if (remoteStatus === -1) {
              const updated = await prisma.order.update({
                where: { id: orderId },
                data: { status: 'FAILED' },
              })
              return NextResponse.json({ status: updated.status })
            }
          }
        }
      } catch (err) {
        console.warn('Auto-poll check to iPaymu failed temporarily:', err)
      }
    }

    return NextResponse.json({
      status: order.status,
      expiredAt: order.expiredAt,
    })
  } catch (error) {
    console.error('Error fetching order status:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil status order' },
      { status: 500 }
    )
  }
}
