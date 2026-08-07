export interface TelegramNotificationProps {
  orderId: string
  productTitle: string
  amount: number
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  createdAt: Date
}

const getTelegramConfig = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN || ''
  const chatId = process.env.TELEGRAM_CHAT_ID || ''
  return { token, chatId }
}

export async function sendTelegramOrderNotification({
  orderId,
  productTitle,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  createdAt,
}: TelegramNotificationProps) {
  const { token, chatId } = getTelegramConfig()
  if (!token || !chatId) {
    console.warn('Telegram Bot Token or Chat ID not configured. Skipping Telegram notification.')
    return false
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  const dateStr = new Date(createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

  const text = `📦 *PESANAN BARU MASUK!*
----------------------------------
🛍️ *Produk*: ${productTitle}
💰 *Nominal*: *${formatRupiah(amount)}*
🆔 *ID Order*: \`${orderId}\`
👤 *Pembeli*: ${customerName || 'Pembeli Digital'}
📧 *Email*: ${customerEmail || '-'}
📞 *Phone*: ${customerPhone || '-'}
⏰ *Waktu*: ${dateStr}

Silakan cek mutasi DANA / SeaBank Anda. Jika saldo sudah masuk, tekan tombol di bawah:`

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '✅ KONFIRMASI LUNAS',
          callback_data: `approve_${orderId}`,
        },
      ],
    ],
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Failed to send Telegram message:', err)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return false
  }
}

export async function answerTelegramCallbackQuery(callbackQueryId: string, text: string) {
  const { token } = getTelegramConfig()
  if (!token) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: true,
      }),
    })
  } catch (error) {
    console.error('Error answering Telegram callback query:', error)
  }
}

export async function editTelegramMessageText(chatId: number | string, messageId: number, text: string) {
  const { token } = getTelegramConfig()
  if (!token) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
      }),
    })
  } catch (error) {
    console.error('Error editing Telegram message text:', error)
  }
}
