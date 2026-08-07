'use client'

import { useState } from 'react'
import { DollarSign, Download, Calendar, TrendingUp, Wallet, ShieldCheck } from 'lucide-react'

interface PaidOrderItem {
  id: string
  amount: number
  status: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  createdAt: string
  product: {
    title: string
    category: string | null
  }
}

export function FinancialLedger({ orders }: { orders: PaidOrderItem[] }) {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'month'>('all')

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  // Filter orders by date range
  const filteredOrders = orders.filter((o) => {
    const orderDate = new Date(o.createdAt)
    const now = new Date()

    if (filterPeriod === 'today') {
      return orderDate.toDateString() === now.toDateString()
    } else if (filterPeriod === 'month') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      )
    }
    return true
  })

  const totalOmzet = filteredOrders.reduce((sum, o) => sum + o.amount, 0)
  const averageOrder = filteredOrders.length > 0 ? Math.round(totalOmzet / filteredOrders.length) : 0

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return

    const headers = ['ID Order', 'Waktu Pembayaran', 'Produk', 'Kategori', 'Pembeli', 'Email', 'Nominal (Rp)']
    const rows = filteredOrders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleString('id-ID'),
      `"${o.product.title.replace(/"/g, '""')}"`,
      o.product.category || '-',
      `"${(o.customerName || 'Pembeli Anonim').replace(/"/g, '""')}"`,
      o.customerEmail || '-',
      o.amount,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `rekap-keuangan-${filterPeriod}-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 font-body">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="comic-card bg-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Omzet (Lunas)</span>
            <span className="font-comic text-2xl sm:text-3xl text-[#E63946]">{formatRupiah(totalOmzet)}</span>
          </div>
          <div className="p-3 bg-red-100 border-2 border-[#121212] rounded">
            <DollarSign className="w-6 h-6 text-[#E63946]" />
          </div>
        </div>

        <div className="comic-card bg-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block">Transaksi Terkonfirmasi</span>
            <span className="font-comic text-2xl sm:text-3xl text-green-600">{filteredOrders.length} Lunas</span>
          </div>
          <div className="p-3 bg-green-100 border-2 border-[#121212] rounded">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="comic-card bg-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block">Rata-rata Order Value</span>
            <span className="font-comic text-2xl text-[#1D3557]">{formatRupiah(averageOrder)}</span>
          </div>
          <div className="p-3 bg-blue-100 border-2 border-[#121212] rounded">
            <Wallet className="w-6 h-6 text-[#1D3557]" />
          </div>
        </div>
      </div>

      {/* Info Notice about Physical Funds */}
      <div className="p-4 bg-[#FFEE00]/40 border-3 border-[#121212] rounded-xl flex items-start gap-3 shadow-[3px_3px_0_#121212]">
        <ShieldCheck className="w-6 h-6 text-[#E63946] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-800 space-y-1">
          <span className="font-bold text-[#121212] block">Catatan Rekapitulasi Keuangan Toko:</span>
          <p>
            Semua dana fisik dari pembayaran pembeli <strong>100% masuk langsung ke DANA Bisnis (085217126862) atau SeaBank (901061277934)</strong> milik Anda. Halaman ini berfungsi sebagai buku kas digital (ledger) untuk mencatat arus masuk &amp; omzet toko secara otomatis.
          </p>
        </div>
      </div>

      {/* Filters & CSV Export Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700">Filter Periode:</span>
          <button
            onClick={() => setFilterPeriod('all')}
            className={`comic-badge cursor-pointer ${filterPeriod === 'all' ? 'bg-[#121212] text-[#FFEE00]' : 'bg-white text-[#121212]'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterPeriod('today')}
            className={`comic-badge cursor-pointer ${filterPeriod === 'today' ? 'bg-[#121212] text-[#FFEE00]' : 'bg-white text-[#121212]'}`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setFilterPeriod('month')}
            className={`comic-badge cursor-pointer ${filterPeriod === 'month' ? 'bg-[#121212] text-[#FFEE00]' : 'bg-white text-[#121212]'}`}
          >
            Bulan Ini
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredOrders.length === 0}
          className="comic-btn-yellow text-xs py-2 px-4 shadow-[2px_2px_0_#121212] disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Laporan Keuangan (CSV)</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="comic-panel bg-white p-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-body border-collapse">
          <thead>
            <tr className="border-b-3 border-[#121212] bg-[#FFEE00] font-comic text-sm">
              <th className="p-3">Waktu Masuk</th>
              <th className="p-3">ID Order</th>
              <th className="p-3">Produk</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Pembeli</th>
              <th className="p-3 text-right">Omzet Masuk (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500 font-bold">
                  Tidak ada data transaksi lunas pada periode ini.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => (
                <tr key={o.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3 font-mono text-[11px] text-gray-500">
                    {new Date(o.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 font-mono font-bold text-[#121212] text-[11px]">{o.id}</td>
                  <td className="p-3 font-bold text-[#121212]">{o.product.title}</td>
                  <td className="p-3 font-bold text-[#E63946]">{o.product.category || '-'}</td>
                  <td className="p-3">
                    <span className="font-bold text-gray-800 block">{o.customerName || 'Pembeli Anonim'}</span>
                    {o.customerEmail && <span className="text-[10px] text-gray-500 block">{o.customerEmail}</span>}
                  </td>
                  <td className="p-3 text-right font-comic text-sm text-green-700">
                    {formatRupiah(o.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
