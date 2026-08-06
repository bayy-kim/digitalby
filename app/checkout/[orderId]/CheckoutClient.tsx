'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Clock, Loader2, RefreshCw, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react'
import QRCodeGenerator from 'qrcode'

interface CheckoutClientProps {
  order: {
    id: string
    amount: number
    status: string
    qrisUrl: string | null
    expiredAt: string
    productTitle: string
    customerName: string | null
  }
}

export function CheckoutClient({ order }: CheckoutClientProps) {
  const router = useRouter()
  const [qrisImage, setQrisImage] = useState<string | null>(order.qrisUrl)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState<boolean>(order.status === 'EXPIRED')
  const [pollingStatus, setPollingStatus] = useState<string>(order.status)

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Generate QR Code data URL if string provided
  useEffect(() => {
    if (order.qrisUrl && !order.qrisUrl.startsWith('http') && !order.qrisUrl.startsWith('data:image')) {
      QRCodeGenerator.toDataURL(order.qrisUrl, { width: 300, margin: 2 })
        .then((url) => setQrisImage(url))
        .catch((err) => console.error('Gagal generate QR Code client:', err))
    }
  }, [order.qrisUrl])

  // Countdown Timer
  useEffect(() => {
    const targetTime = new Date(order.expiredAt).getTime()

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const difference = targetTime - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft('00:00:00')
        clearInterval(interval)
      } else {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        )
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [order.expiredAt])

  // Auto-polling status API every 4 seconds
  useEffect(() => {
    if (pollingStatus === 'PAID') {
      router.push(`/order/${order.id}`)
      return
    }

    if (isExpired || pollingStatus === 'EXPIRED' || pollingStatus === 'FAILED') {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`)
        if (res.ok) {
          const data = await res.json()
          setPollingStatus(data.status)
          if (data.status === 'PAID') {
            router.push(`/order/${order.id}`)
          } else if (data.status === 'EXPIRED') {
            setIsExpired(true)
          }
        }
      } catch (err) {
        console.warn('Poll status error:', err)
      }
    }, 4000)

    return () => clearInterval(pollInterval)
  }, [order.id, pollingStatus, isExpired, router])

  return (
    <div className="comic-panel bg-white p-6 space-y-6">
      {/* Header Info */}
      <div className="text-center border-b-3 border-[#121212] pb-4">
        <span className="comic-badge bg-[#FFEE00] text-[#121212] mb-2">
          PEMBAYARAN QRIS INSTAN
        </span>
        <h1 className="font-comic text-2xl sm:text-3xl text-[#121212] leading-snug">
          {order.productTitle}
        </h1>
        <p className="text-xs text-gray-600 font-body mt-1">
          ID Order: <span className="font-mono font-bold text-[#121212]">{order.id}</span>
        </p>
      </div>

      {/* Amount Box - Must be Exact */}
      <div className="p-4 bg-[#FFEE00] border-3 border-[#121212] rounded-lg text-center shadow-[3px_3px_0_#121212]">
        <span className="text-[11px] font-bold text-[#121212] uppercase block tracking-wider">
          Nominal Pembayaran Harus Persis Sama
        </span>
        <span className="font-comic text-4xl text-[#E63946] block my-1">
          {formatRupiah(order.amount)}
        </span>
        <span className="text-[10px] bg-[#121212] text-white font-bold px-2 py-0.5 rounded inline-block">
          Sistem Otomatis Deteksi QRIS
        </span>
      </div>

      {/* QRIS Display Section */}
      {isExpired ? (
        <div className="p-6 bg-red-50 border-3 border-[#121212] rounded-lg text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#E63946] mx-auto" />
          <h2 className="font-comic text-2xl text-[#121212]">WAKTU PEMBAYARAN HABIS!</h2>
          <p className="text-xs text-gray-700 font-body">
            QRIS ini sudah kedaluwarsa. Silakan buat pesanan baru untuk mendapatkan QRIS pembayaran aktif.
          </p>
          <button
            onClick={() => router.push('/')}
            className="comic-btn-primary text-xs py-2 px-4"
          >
            Buat Pesanan Baru
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border-2 border-[#121212] rounded-lg relative">
          <div className="mb-2 text-center">
            <span className="text-xs font-bold text-gray-700 block">Scan dengan aplikasi e-Wallet / Mobile Banking:</span>
            <span className="text-[10px] text-gray-500 font-body block">GoPay, OVO, DANA, ShopeePay, BCA, Mandiri, BRI, dll.</span>
          </div>

          <div className="bg-white p-3 border-3 border-[#121212] rounded-lg shadow-[4px_4px_0_#121212] my-2">
            {qrisImage ? (
              <img
                src={qrisImage}
                alt="QRIS Pembayaran"
                className="w-56 h-56 object-contain mx-auto"
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center bg-gray-100 text-gray-500 gap-2">
                <QrCode className="w-12 h-12" />
                <span className="text-xs font-bold">Memuat Kode QRIS...</span>
              </div>
            )}
          </div>

          {/* Countdown & Polling Status */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border-2 border-[#121212] rounded text-xs font-bold">
              <Clock className="w-4 h-4 text-[#E63946]" />
              <span>Sisa Waktu Pembayaran: <span className="font-comic text-base text-[#E63946]">{timeLeft || '...'}</span></span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mt-1">
              <Loader2 className="w-4 h-4 text-[#1D3557] animate-spin" />
              <span>Mengecek status pembayaran secara otomatis...</span>
            </div>
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="border-t-2 border-gray-200 pt-4 space-y-2 text-[11px] text-gray-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>Halaman ini akan otomatis berpindah begitu pembayaran Anda terkonfirmasi.</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#1D3557] flex-shrink-0" />
          <span>Tautan unduhan file produk langsung aktif 100% tanpa campur tangan manual.</span>
        </div>
      </div>
    </div>
  )
}
