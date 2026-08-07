import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { answerTelegramCallbackQuery, editTelegramMessageText } from '@/lib/telegram'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Handle Callback Query from Telegram Inline Keyboard
    if (body.callback_query) {
      const callbackQuery = body.callback_query
      const callbackQueryId = callbackQuery.id
      const dataStr = callbackQuery.data || ''
      const message = callbackQuery.message
      const chatId = message?.chat?.id
      const messageId = message?.message_id

      if (dataStr.startsWith('approve_')) {
        const orderId = dataStr.replace('approve_', '')

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { product: true },
        })

        if (!order) {
          await answerTelegramCallbackQuery(callbackQueryId, '❌ Order tidak ditemukan.')
          return NextResponse.json({ ok: true })
        }

        if (order.status === 'PAID') {
          await answerTelegramCallbackQuery(callbackQueryId, '✅ Order ini sudah terkonfirmasi LUNAS sebelumnya.')
          return NextResponse.json({ ok: true })
        }

        // Update Order to PAID
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID' },
        })

        // Decrement Product Stock & Handle EXCLUSIVE_SINGLE
        if (order.product) {
          const isExclusive = order.product.licenseType === 'EXCLUSIVE_SINGLE'
          const newStock = Math.max(0, order.product.stock - 1)

          await prisma.product.update({
            where: { id: order.product.id },
            data: {
              stock: newStock,
              isActive: isExclusive ? false : newStock > 0 ? order.product.isActive : false,
            },
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

        // Audit Log
        await prisma.auditLog.create({
          data: {
            actor: 'TELEGRAM_BOT_ADMIN',
            action: 'TELEGRAM_APPROVE_ORDER',
            detail: `Konfirmasi lunas via Telegram Bot 1-Click untuk order ${orderId}`,
            ipAddress: 'TELEGRAM_API',
          },
        })

        // Answer popup alert in Telegram
        await answerTelegramCallbackQuery(callbackQueryId, `🎉 PESANAN LUNAS!\nOrder ${orderId} telah dikonfirmasi lunas & file di-unlock!`)

        // Edit Telegram message to show confirmed state
        if (chatId && messageId) {
          const updatedText = `${message.text}\n\n✅ *STATUS: TERKONFIRMASI LUNAS* (${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })})`
          await editTelegramMessageText(chatId, messageId, updatedText)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error handling Telegram webhook:', error)
    return NextResponse.json({ ok: true })
  }
}
