'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Download, Loader2, AlertCircle, RefreshCw, ShoppingBag, ShieldCheck, FileCheck } from 'lucide-react'

interface OrderStatusClientProps {
  order: {
    id: string
    amount: number
    status: string
    createdAt: string
    product: {
      id: string
      title: string
      description: string
      filesCount: number
    }
  }
  initialToken: string | null
}

export function OrderStatusClient({ order, initialToken }: OrderStatusClientProps) {
  const router = useRouter()
  const [downloadToken, setDownloadToken] = useState<string | null>(initialToken)
  const [downloading, setDownloading] = useState(false)
  const [status, setStatus] = useState<string>(order.status)
  const [fetchingToken, setFetchingToken] = useState(false)

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Poll status if PENDING
  useEffect(() => {
    if (status !== 'PENDING') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.status !== 'PENDING') {
            setStatus(data.status)
            if (data.status === 'PAID') {
              fetchToken()
            }
          }
        }
      } catch (err) {
        console.warn('Poll error:', err)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [status, order.id])

  // Fetch token if PAID but token not present
  const fetchToken = async () => {
    setFetchingToken(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/token`)
      if (res.ok) {
        const data = await res.json()
        setDownloadToken(data.token)
      }
    } catch (err) {
      console.error('Fetch token error:', err)
    } finally {
      setFetchingToken(false)
    }
  }

  useEffect(() => {
    if (status === 'PAID' && !downloadToken) {
      fetchToken()
    }
  }, [status, downloadToken])

  const handleDownload = async () => {
    if (!downloadToken) {
      await fetchToken()
    }
    if (!downloadToken) return

    setDownloading(true)
    try {
      // Trigger download via direct window location / download endpoint
      window.location.href = `/api/download/${downloadToken}`
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setTimeout(() => setDownloading(false), 3000)
    }
  }

  return (
    <div className="comic-panel bg-white p-6 space-y-6">
      {/* STATUS: PAID */}
      {status === 'PAID' && (
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-green-100 border-3 border-[#121212] rounded-full shadow-[3px_3px_0_#121212]">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <span className="comic-badge bg-green-500 text-white text-xs block max-w-xs mx-auto">
            PEMBAYARAN SUKSES & DIVERIFIKASI
          </span>

          <h1 className="font-comic text-3xl text-[#121212]">
            FILE ANDA SIAP DIUNDUH!
          </h1>

          <div className="p-4 bg-[#F8F9FA] border-2 border-[#121212] rounded-lg text-left space-y-2">
            <h2 className="font-bold text-sm text-[#121212]">{order.product.title}</h2>
            <p className="text-xs text-gray-600 line-clamp-2">{order.product.description}</p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs font-bold text-gray-700">
              <span>Total Pembayaran: {formatRupiah(order.amount)}</span>
              <span>{order.product.filesCount} Berkas Berhasil Di-unlock</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading || fetchingToken}
              className="comic-btn-yellow w-full text-base py-3 shadow-[4px_4px_0_#121212]"
            >
              {downloading || fetchingToken ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>MENYIAPKAN UNDUHAN...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>UNDUH FILE SEKARANG</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-[#FFEE00] border-2 border-[#121212] rounded text-left text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#121212]">
              <FileCheck className="w-4 h-4 text-[#E63946]" />
              <span>Petunjuk Unduhan:</span>
            </div>
            <p className="text-[11px] text-gray-800">
              Tautan unduhan aman ini berlaku selama 24 jam. Jika produk berisi lebih dari 1 file, sistem akan mengunduhnya secara otomatis dalam format berkas ZIP.
            </p>
          </div>
        </div>
      )}

      {/* STATUS: PENDING */}
      {status === 'PENDING' && (
        <div className="text-center space-y-4 py-4">
          <div className="inline-block p-4 bg-[#FFEE00] border-3 border-[#121212] rounded-full shadow-[3px_3px_0_#121212]">
            <Loader2 className="w-12 h-12 text-[#121212] animate-spin" />
          </div>

          <span className="comic-badge bg-[#FFEE00] text-[#121212] text-xs">
            MENUNGGU VERIFIKASI QRIS
          </span>

          <h1 className="font-comic text-2xl text-[#121212]">
            MEMPROSES STATUS PEMBAYARAN...
          </h1>

          <p className="text-xs text-gray-700 font-body max-w-sm mx-auto">
            Sistem kami sedang melakukan pengecekan transaksi QRIS Anda secara otomatis. Halaman ini akan memperbarui statusnya secara berkala.
          </p>

          <div className="p-3 bg-gray-50 border-2 border-[#121212] rounded text-xs font-mono text-gray-600">
            ID Order: {order.id}
          </div>

          <button
            onClick={() => router.push(`/checkout/${order.id}`)}
            className="comic-btn-dark text-xs py-2 px-4 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Lihat Kode QRIS Pembayaran</span>
          </button>
        </div>
      )}

      {/* STATUS: EXPIRED OR FAILED */}
      {(status === 'EXPIRED' || status === 'FAILED') && (
        <div className="text-center space-y-4 py-4">
          <div className="inline-block p-4 bg-red-100 border-3 border-[#121212] rounded-full shadow-[3px_3px_0_#121212]">
            <AlertCircle className="w-12 h-12 text-[#E63946]" />
          </div>

          <span className="comic-badge bg-[#E63946] text-white text-xs">
            {status === 'EXPIRED' ? 'TRANSAKSI KEDALUWARSA' : 'TRANSAKSI GAGAL'}
          </span>

          <h1 className="font-comic text-2xl text-[#121212]">
            {status === 'EXPIRED'
              ? 'WAKTU PEMBAYARAN QRIS TELAH HABIS'
              : 'PEMBAYARAN TIDAK DAPAT DIVERIFIKASI'}
          </h1>

          <p className="text-xs text-gray-700 font-body max-w-sm mx-auto">
            Pesanan ini tidak berhasil diselesaikan. Silakan buat pesanan baru untuk melanjutkan pembelian produk ini.
          </p>

          <button
            onClick={() => router.push('/')}
            className="comic-btn-primary text-xs py-2.5 px-5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buat Pesanan Baru</span>
          </button>
        </div>
      )}
    </div>
  )
}
