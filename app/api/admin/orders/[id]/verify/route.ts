import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const reason = body.reason || 'Verifikasi manual oleh admin'

    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    // Update order status to PAID
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'PAID' },
    })

    // Generate download token if not exists
    const existingToken = await prisma.downloadToken.findFirst({
      where: {
        orderId: id,
        expiresAt: { gt: new Date() },
      },
    })

    if (!existingToken) {
      const tokenStr = crypto.randomBytes(32).toString('hex')
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await prisma.downloadToken.create({
        data: {
          token: tokenStr,
          orderId: id,
          expiresAt: tokenExpiresAt,
          maxUses: 5,
        },
      })
    }

    // Record in AuditLog (who override, which order, timestamp, reason, IP)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    await prisma.auditLog.create({
      data: {
        actor: session.user?.email || 'admin',
        action: 'MANUAL_VERIFY_ORDER',
        detail: `Manual override status order ${id} ke PAID. Alasan: ${reason}`,
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error('Error manual verifying order:', error)
    return NextResponse.json({ error: 'Gagal memverifikasi order' }, { status: 500 })
  }
}
