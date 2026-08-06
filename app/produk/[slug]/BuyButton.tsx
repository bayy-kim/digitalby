'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Loader2, Lock } from 'lucide-react'

export function BuyButton({
  productId,
  price,
  title,
}: {
  productId: string
  price: number
  title: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault()
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

      // Redirect to checkout page
      router.push(`/checkout/${data.orderId}`)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleBuy} className="space-y-4 pt-2">
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
            <span>MEMPROSES QRIS...</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>BELI SEKARANG</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-600 font-bold">
        <Lock className="w-3.5 h-3.5 text-gray-500" />
        <span>Pembayaran Aman Menggunakan QRIS (Gopay, OVO, Dana, ShopeePay, BCA, dll)</span>
      </div>
    </form>
  )
}
