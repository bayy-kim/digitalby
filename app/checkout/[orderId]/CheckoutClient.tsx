'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Clock, Loader2, RefreshCw, AlertCircle, ShieldCheck, CheckCircle2, Upload, Ban, CreditCard, Copy, Check } from 'lucide-react'
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
  const [qrisImage, setQrisImage] = useState<string | null>(order.qrisUrl || '/qris-dana.svg')
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState<boolean>(order.status === 'EXPIRED')
  const [pollingStatus, setPollingStatus] = useState<string>(order.status)
  
  // Payment Proof Upload State
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [proofMessage, setProofMessage] = useState<string | null>(null)

  // Cancel State
  const [canceling, setCanceling] = useState(false)

  // Copy State
  const [copiedAccount, setCopiedAccount] = useState(false)

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Generate QR Code data URL if dynamic iPaymu string provided
  useEffect(() => {
    if (order.qrisUrl && !order.qrisUrl.startsWith('http') && !order.qrisUrl.startsWith('/') && !order.qrisUrl.startsWith('data:image')) {
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

  // Handle Payment Proof Upload to Server & Telegram
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proofFile) return

    setUploadingProof(true)
    setProofMessage(null)

    try {
      const formData = new FormData()
      formData.append('proof', proofFile)

      const res = await fetch(`/api/orders/${order.id}/proof`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengunggah bukti pembayaran')
      }

      setProofMessage('✅ Bukti pembayaran berhasil terkirim! Admin akan langsung mengonfirmasi.')
      setProofFile(null)
    } catch (err: any) {
      setProofMessage(`❌ ${err.message || 'Gagal mengunggah bukti'}`)
    } finally {
      setUploadingProof(false)
    }
  }

  // Handle Cancel Order
  const handleCancelOrder = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return

    setCanceling(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
      })
      if (res.ok) {
        setIsExpired(true)
        setPollingStatus('EXPIRED')
      }
    } catch (err) {
      alert('Gagal membatalkan pesanan')
    } finally {
      setCanceling(false)
    }
  }

  const copySeaBank = () => {
    navigator.clipboard.writeText('901061277934')
    setCopiedAccount(true)
    setTimeout(() => setCopiedAccount(false), 2000)
  }

  return (
    <div className="comic-panel bg-white p-5 sm:p-6 space-y-6">
      {/* Header Info */}
      <div className="text-center border-b-3 border-[#121212] pb-4">
        <span className="comic-badge bg-[#FFEE00] text-[#121212] mb-2">
          PEMBAYARAN QRIS / TRANSFER BANK
        </span>
        <h1 className="font-comic text-2xl sm:text-3xl text-[#121212] leading-snug">
          {order.productTitle}
        </h1>
        <p className="text-xs text-gray-600 font-body mt-1">
          ID Order: <span className="font-mono font-bold text-[#121212]">{order.id}</span>
        </p>
      </div>

      {/* Amount Box */}
      <div className="p-4 bg-[#FFEE00] border-3 border-[#121212] rounded-lg text-center shadow-[3px_3px_0_#121212]">
        <span className="text-[11px] font-bold text-[#121212] uppercase block tracking-wider">
          Nominal Pembayaran Harus Persis Sama
        </span>
        <span className="font-comic text-4xl text-[#E63946] block my-1">
          {formatRupiah(order.amount)}
        </span>
        <span className="text-[10px] bg-[#121212] text-white font-bold px-2 py-0.5 rounded inline-block">
          Sistem Deteksi Otomatis &amp; Konfirmasi Instant
        </span>
      </div>

      {/* QRIS / Transfer / Canceled Section */}
      {isExpired ? (
        <div className="p-6 bg-red-50 border-3 border-[#121212] rounded-lg text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#E63946] mx-auto" />
          <h2 className="font-comic text-2xl text-[#121212]">PESANAN DIBATALKAN / HABIS WAKTU</h2>
          <p className="text-xs text-gray-700 font-body">
            Pesanan ini telah kedaluwarsa atau dibatalkan. Silakan buat pesanan baru untuk mendapatkan kode pembayaran aktif.
          </p>
          <button
            onClick={() => router.push('/')}
            className="comic-btn-primary text-xs py-2 px-4"
          >
            Buat Pesanan Baru
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* QRIS & SEABANK SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OPSI 1: QRIS DANA BISNIS */}
            <div className="p-4 bg-gray-50 border-2 border-[#121212] rounded-lg flex flex-col items-center justify-between text-center">
              <div>
                <span className="text-xs font-bold text-[#121212] block uppercase mb-1">
                  1. QRIS DANA BISNIS / ALL PAYMENT
                </span>
                <span className="text-[10px] text-gray-500 font-body block mb-2">
                  Scan pakai DANA, GoPay, OVO, ShopeePay, BCA, dll.
                </span>
              </div>

              <div className="bg-white p-2.5 border-3 border-[#121212] rounded-lg shadow-[3px_3px_0_#121212] my-2">
                <img
                  src={qrisImage || '/qris-dana.svg'}
                  alt="QRIS Pembayaran"
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>

              <span className="text-[10px] bg-[#FFEE00] text-[#121212] font-bold px-2 py-0.5 rounded border border-[#121212]">
                Satu QRIS Untuk Semua Aplikasi
              </span>
            </div>

            {/* OPSI 2: TRANSFER SEABANK */}
            <div className="p-4 bg-blue-50/60 border-2 border-[#121212] rounded-lg flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-[#1D3557] block uppercase mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#1D3557]" />
                  <span>2. TRANSFER BANK SEABANK</span>
                </span>
                <span className="text-[10px] text-gray-600 font-body block">
                  Bisa transfer antar-bank via BI-FAST / Realtime.
                </span>
              </div>

              <div className="bg-white p-3 border-2 border-[#121212] rounded space-y-2 font-body text-xs">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Nama Bank:</span>
                  <span className="font-bold text-[#121212]">SeaBank</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Atas Nama:</span>
                  <span className="font-bold text-[#121212]">Muhamad Ai Bayu</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-gray-600">No. Rekening:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-base text-[#E63946]">901061277934</span>
                    <button
                      onClick={copySeaBank}
                      className="p-1 bg-[#FFEE00] border border-[#121212] rounded text-[10px] font-bold hover:bg-yellow-400"
                    >
                      {copiedAccount ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-[#121212]" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-white border border-[#121212] rounded text-[10px] text-gray-600">
                Transfer persis <strong className="text-[#E63946]">{formatRupiah(order.amount)}</strong> untuk mempermudah verifikasi.
              </div>
            </div>
          </div>

          {/* Countdown & Status */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border-2 border-[#121212] rounded text-xs font-bold shadow-[2px_2px_0_#121212]">
              <Clock className="w-4 h-4 text-[#E63946]" />
              <span>Sisa Waktu Pembayaran: <span className="font-comic text-base text-[#E63946]">{timeLeft || '...'}</span></span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mt-1">
              <Loader2 className="w-4 h-4 text-[#1D3557] animate-spin" />
              <span>Mengecek status pembayaran secara otomatis...</span>
            </div>
          </div>

          {/* KONFIRMASI / UPLOAD BUKTI PEMBAYARAN FORM */}
          <div className="comic-panel p-4 bg-[#FFEE00]/20 space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-[#121212] pb-2">
              <Upload className="w-4 h-4 text-[#E63946]" />
              <h3 className="font-comic text-lg text-[#121212]">KONFIRMASI / UPLOAD BUKTI TRANSFER</h3>
            </div>

            <p className="text-xs text-gray-700 font-body">
              Sudah melakukan pembayaran? Unggah foto struk/bukti transfer Anda di sini agar admin dapat langsung memverifikasinya via Telegram.
            </p>

            {proofMessage && (
              <div className="p-2.5 bg-white border-2 border-[#121212] rounded text-xs font-bold text-gray-800">
                {proofMessage}
              </div>
            )}

            <form onSubmit={handleUploadProof} className="space-y-3">
              <input
                type="file"
                required
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="w-full text-xs p-2 border-2 border-[#121212] rounded bg-white font-body"
              />

              <button
                type="submit"
                disabled={uploadingProof || !proofFile}
                className="comic-btn-yellow w-full text-xs py-2 shadow-[2px_2px_0_#121212]"
              >
                {uploadingProof ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>MENGIRIM BUKTI...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>KIRIM BUKTI PEMBAYARAN SEKARANG</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CANCEL ORDER BUTTON */}
          <div className="pt-2 text-center">
            <button
              onClick={handleCancelOrder}
              disabled={canceling}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-white border-2 border-red-700 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
            >
              {canceling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              <span>Batalkan Pesanan Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="border-t-2 border-gray-200 pt-4 space-y-2 text-[11px] text-gray-600 font-body">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>Halaman ini akan otomatis berpindah begitu pembayaran Anda terkonfirmasi.</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#1D3557] flex-shrink-0" />
          <span>Tautan unduhan file produk langsung aktif 100% tanpa batas tunggu.</span>
        </div>
      </div>
    </div>
  )
}
