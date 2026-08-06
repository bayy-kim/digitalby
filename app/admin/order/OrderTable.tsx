'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, AlertTriangle, Check, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react'

interface OrderItem {
  id: string
  amount: number
  status: string
  ipaymuTrxId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  createdAt: string
  product: {
    title: string
    slug: string
  }
}

export function OrderTable({ initialOrders }: { initialOrders: OrderItem[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  const handleManualVerify = async (orderId: string, title: string) => {
    const reason = prompt(`Masukkan alasan verifikasi manual untuk order ${orderId} (${title}):`, 'Dikonfirmasi manual oleh admin via mutasi bank')
    if (reason === null) return

    setVerifyingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!res.ok) throw new Error('Gagal verifikasi manual')

      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: 'PAID' } : o))
      )
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan')
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div className="comic-panel bg-white p-4 overflow-x-auto">
      <table className="w-full text-left text-xs font-body border-collapse">
        <thead>
          <tr className="border-b-3 border-[#121212] bg-[#FFEE00] font-comic text-sm">
            <th className="p-3">ID Order / Waktu</th>
            <th className="p-3">Produk</th>
            <th className="p-3">Pembeli</th>
            <th className="p-3">Nominal</th>
            <th className="p-3">iPaymu TrxID</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Verifikasi Manual</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-6 text-center text-gray-500 font-bold">
                Belum ada transaksi masuk.
              </td>
            </tr>
          ) : (
            orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3">
                  <span className="font-mono font-bold text-[#121212] block text-[11px]">{o.id}</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(o.createdAt).toLocaleString('id-ID')}
                  </span>
                </td>
                <td className="p-3">
                  <span className="font-bold text-[#121212] block">{o.product.title}</span>
                </td>
                <td className="p-3">
                  <span className="font-bold text-gray-800 block">{o.customerName || 'Pembeli Anonim'}</span>
                  {o.customerEmail && <span className="text-[10px] text-gray-500 block">{o.customerEmail}</span>}
                </td>
                <td className="p-3 font-comic text-sm text-[#E63946]">
                  {formatRupiah(o.amount)}
                </td>
                <td className="p-3 font-mono text-[11px] text-gray-600">
                  {o.ipaymuTrxId || '-'}
                </td>
                <td className="p-3">
                  {o.status === 'PAID' && (
                    <span className="comic-badge bg-green-500 text-white">PAID</span>
                  )}
                  {o.status === 'PENDING' && (
                    <span className="comic-badge bg-[#FFEE00] text-[#121212]">PENDING</span>
                  )}
                  {(o.status === 'EXPIRED' || o.status === 'FAILED') && (
                    <span className="comic-badge bg-gray-400 text-white">{o.status}</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {o.status !== 'PAID' ? (
                    <button
                      onClick={() => handleManualVerify(o.id, o.product.title)}
                      disabled={verifyingId === o.id}
                      className="comic-btn-primary text-[10px] py-1 px-2.5"
                    >
                      {verifyingId === o.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Verifikasi Manual</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] text-green-700 font-bold flex items-center justify-end gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Terverifikasi</span>
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
