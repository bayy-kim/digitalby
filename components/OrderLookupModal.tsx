'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2, FileCheck, ArrowRight } from 'lucide-react'

export function OrderLookupModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedId = orderId.trim()
    if (!cleanedId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/orders/${cleanedId}/status`)
      if (!res.ok) {
        throw new Error('ID Pesanan tidak ditemukan. Periksa kembali ID Order Anda.')
      }

      onClose()
      router.push(`/order/${cleanedId}`)
    } catch (err: any) {
      setError(err.message || 'ID Pesanan tidak ditemukan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="comic-panel bg-white p-6 max-w-md w-full space-y-4 shadow-[8px_8px_0_#121212] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b-3 border-[#121212] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-[#FFEE00] border-2 border-[#121212] rounded">
              <FileCheck className="w-5 h-5 text-[#121212]" />
            </div>
            <h2 className="font-comic text-2xl text-[#121212]">CEK STATUS PESANAN</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-gray-200 border-2 border-[#121212] rounded hover:bg-gray-300 transition-colors"
          >
            <X className="w-5 h-5 text-[#121212]" />
          </button>
        </div>

        <p className="text-xs text-gray-700 font-body leading-relaxed">
          Masukkan <strong>ID Order</strong> yang Anda dapatkan saat melakukan pesanan untuk mengecek status pembayaran atau mengunduh ulang file produk Anda.
        </p>

        {error && (
          <div className="p-3 bg-red-100 border-2 border-[#121212] rounded text-xs text-red-800 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              ID Order (UUID Pesanan)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Contoh: 7a8b9c0d-1234-5678-90ab-cdef12345678"
                className="w-full pl-9 pr-3 py-2.5 text-xs border-2 border-[#121212] rounded font-mono focus:ring-2 focus:ring-[#FFEE00] focus:outline-none"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="comic-btn-yellow w-full text-xs py-2.5 shadow-[3px_3px_0_#121212]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>MENGECEK PESANAN...</span>
              </>
            ) : (
              <>
                <span>CARI PESANAN SAYA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="p-3 bg-[#FFEE00]/40 border-2 border-[#121212] rounded text-[11px] text-gray-800">
          <strong>Lupa ID Order?</strong> Hubungi admin via WhatsApp dengan melampirkan bukti transfer pembayaran Anda.
        </div>
      </div>
    </div>
  )
}
