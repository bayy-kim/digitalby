import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        downloadTokens: {
          where: {
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    if (order.status !== 'PAID') {
      return NextResponse.json({ error: 'Order belum dibayar' }, { status: 400 })
    }

    let tokenObj = order.downloadTokens[0]

    // If no active valid token exists, generate a new cryptographic token
    if (!tokenObj) {
      const tokenStr = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      tokenObj = await prisma.downloadToken.create({
        data: {
          token: tokenStr,
          orderId: order.id,
          expiresAt,
          maxUses: 5,
        },
      })
    }

    return NextResponse.json({
      token: tokenObj.token,
      expiresAt: tokenObj.expiresAt,
    })
  } catch (error) {
    console.error('Error fetching download token:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil token unduhan' },
      { status: 500 }
    )
  }
}
