import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { sendTelegramPhotoNotification } from '@/lib/telegram'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const formData = await request.formData()
    const proofFile = formData.get('proof') as File | null

    if (!proofFile || proofFile.size === 0) {
      return NextResponse.json({ error: 'File bukti pembayaran wajib diunggah' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (order.status === 'PAID') {
      return NextResponse.json({ message: 'Pesanan ini sudah terkonfirmasi lunas sebelumnya' })
    }

    // Upload proof image to Vercel Blob
    const proofBlob = await put(`proofs/${orderId}/${Date.now()}-${proofFile.name}`, proofFile, {
      access: 'private',
    })

    // Format Rupiah
    const formatRupiah = (num: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)

    // Caption for Telegram
    const caption = `📸 *BUKTI PEMBAYARAN DIUNGGAH PEMBELI!*
----------------------------------
🛍️ *Produk*: ${order.product.title}
💰 *Nominal*: *${formatRupiah(order.amount)}*
🆔 *ID Order*: \`${order.id}\`
👤 *Pembeli*: ${order.customerName || 'Pembeli Digital'}

Periksa gambar bukti transfer di atas & mutasi DANA / SeaBank Anda. Tekan tombol di bawah untuk menyetujui:`

    // Forward photo & 1-click button to Telegram Admin
    await sendTelegramPhotoNotification({
      photoUrl: proofBlob.url,
      caption,
      orderId: order.id,
    })

    // Record AuditLog
    await prisma.auditLog.create({
      data: {
        actor: order.customerName || 'BUYER',
        action: 'UPLOAD_PAYMENT_PROOF',
        detail: `Upload bukti transfer untuk order ${order.id}`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Bukti pembayaran berhasil diunggah & dikirim ke admin Telegram!',
    })
  } catch (error: any) {
    console.error('Error uploading payment proof:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal mengunggah bukti pembayaran' },
      { status: 500 }
    )
  }
}
