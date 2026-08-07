'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Loader2, Lock, AlertOctagon } from 'lucide-react'

export function BuyButton({
  productId,
  price,
  title,
  stock,
}: {
  productId: string
  price: number
  title: string
  stock: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const isSoldOut = stock <= 0

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSoldOut) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          customerName: customerName || undefined,
          customerEmail: customerEmail || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat pesanan')
      }

      router.push(`/checkout/${data.orderId}`)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem')
      setLoading(false)
    }
  }

  if (isSoldOut) {
    return (
      <div className="space-y-3 pt-2">
        <div className="p-4 bg-red-100 border-3 border-[#121212] rounded-lg text-center space-y-2 shadow-[3px_3px_0_#121212]">
          <AlertOctagon className="w-8 h-8 text-[#E63946] mx-auto" />
          <h3 className="font-comic text-xl text-[#121212]">STOK PRODUK HABIS (SOLD OUT)</h3>
          <p className="text-xs text-gray-700 font-body">
            Maaf, stok produk digital ini sedang kosong. Silakan periksa kembali nanti atau hubungi admin via WhatsApp untuk ketersediaan ulang.
          </p>
        </div>

        <button
          disabled
          type="button"
          className="w-full text-base py-3 bg-gray-400 text-gray-800 font-comic font-bold border-3 border-[#121212] rounded-lg cursor-not-allowed uppercase shadow-[4px_4px_0_#121212] opacity-80"
        >
          SOLD OUT (HABIS)
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleBuy} className="space-y-4 pt-2 font-body">
      {error && (
        <div className="p-3 bg-red-100 border-2 border-[#121212] rounded text-xs text-red-800 font-bold">
          {error}
        </div>
      )}

      <div className="space-y-3 bg-[#F8F9FA] p-3 border-2 border-[#121212] rounded">
        <span className="text-[11px] font-bold text-gray-700 uppercase block">
          Data Pembeli (Opsional - untuk arsip transaksi Anda)
        </span>
        <input
          type="text"
          placeholder="Nama Anda (opsional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full px-3 py-2 text-xs border-2 border-[#121212] rounded bg-white font-body focus:outline-none focus:ring-2 focus:ring-[#FFEE00]"
        />
        <input
          type="email"
          placeholder="Email Anda (opsional)"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="w-full px-3 py-2 text-xs border-2 border-[#121212] rounded bg-white font-body focus:outline-none focus:ring-2 focus:ring-[#FFEE00]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="comic-btn-primary w-full text-base py-3 shadow-[4px_4px_0_#121212]"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>MEMPROSES PESANAN...</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>BELI SEKARANG</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-600 font-bold text-center">
        <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <span>Pembayaran Aman Menggunakan QRIS DANA &amp; Transfer SeaBank</span>
      </div>
    </form>
  )
}
