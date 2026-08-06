import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardCharts } from './DashboardCharts'
import { DollarSign, ShoppingBag, CheckCircle2, Clock, AlertTriangle, TrendingUp, Package } from 'lucide-react'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session) {
    redirect('/admin/login')
  }

  // Fetch summary metrics
  const orders = await prisma.order.findMany({
    include: {
      product: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalOrders = orders.length
  const paidOrders = orders.filter((o) => o.status === 'PAID')
  const pendingOrders = orders.filter((o) => o.status === 'PENDING')
  const failedOrders = orders.filter((o) => o.status === 'EXPIRED' || o.status === 'FAILED')

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0)

  // Top Products Calculation
  const productSalesMap: Record<string, { title: string; salesCount: number; revenue: number }> = {}
  paidOrders.forEach((o) => {
    if (!productSalesMap[o.productId]) {
      productSalesMap[o.productId] = {
        title: o.product.title,
        salesCount: 0,
        revenue: 0,
      }
    }
    productSalesMap[o.productId].salesCount += 1
    productSalesMap[o.productId].revenue += o.amount
  })

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Order timeline data for Recharts (last 7 days)
  const salesByDateMap: Record<string, { date: string; revenue: number; count: number }> = {}
  paidOrders.forEach((o) => {
    const dateStr = new Date(o.createdAt).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
    })
    if (!salesByDateMap[dateStr]) {
      salesByDateMap[dateStr] = { date: dateStr, revenue: 0, count: 0 }
    }
    salesByDateMap[dateStr].revenue += o.amount
    salesByDateMap[dateStr].count += 1
  })

  const chartData = Object.values(salesByDateMap).reverse()

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-3 border-[#121212] pb-4">
        <div>
          <h1 className="font-comic text-3xl text-[#121212]">DASHBOARD PENJUALAN</h1>
          <p className="text-xs text-gray-600 font-body">
            Ringkasan pendapatan & performa toko digital Bayu Store.
          </p>
        </div>
        <span className="comic-badge bg-[#FFEE00] text-[#121212]">
          Halo, {session.user?.email}
        </span>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="comic-card bg-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Pendapatan</span>
            <span className="font-comic text-2xl text-[#E63946]">{formatRupiah(totalRevenue)}</span>
          </div>
          <div className="p-3 bg-red-100 border-2 border-[#121212] rounded">
            <DollarSign className="w-6 h-6 text-[#E63946]" />
          </div>
        </div>

        <div className="comic-card bg-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block">Pesanan Lunas (PAID)</span>
            <span className="font-comic text-2xl text-green-600">{paidOrders.length} Order</span>
          </div>
          <div className="p-3 bg-green-100 border-2 border-[#121212] rounded">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="comic-card bg-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block">Menunggu Bayar</span>
            <span className="font-comic text-2xl text-[#1D3557]">{pendingOrders.length} Order</span>
          </div>
          <div className="p-3 bg-blue-100 border-2 border-[#121212] rounded">
            <Clock className="w-6 h-6 text-[#1D3557]" />
          </div>
        </div>

        <div className="comic-card bg-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block">Kedaluwarsa / Gagal</span>
            <span className="font-comic text-2xl text-gray-700">{failedOrders.length} Order</span>
          </div>
          <div className="p-3 bg-gray-100 border-2 border-[#121212] rounded">
            <AlertTriangle className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Charts & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 comic-panel bg-white p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
            <h2 className="font-comic text-xl text-[#121212] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#E63946]" />
              <span>GRAFIK PENJUALAN</span>
            </h2>
          </div>
          <DashboardCharts data={chartData} />
        </div>

        <div className="lg:col-span-4 comic-panel bg-white p-4 sm:p-6 space-y-4">
          <h2 className="font-comic text-xl text-[#121212] flex items-center gap-2 border-b-2 border-gray-200 pb-2">
            <Package className="w-5 h-5 text-[#FFEE00]" />
            <span>PRODUK TERLARIS</span>
          </h2>

          {topProducts.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">Belum ada transaksi lunas.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={idx} className="p-3 bg-[#F8F9FA] border-2 border-[#121212] rounded flex items-center justify-between text-xs font-body">
                  <div className="truncate pr-2">
                    <span className="font-bold text-[#121212] block truncate">{p.title}</span>
                    <span className="text-[10px] text-gray-500">{p.salesCount}x Terjual</span>
                  </div>
                  <span className="font-comic text-sm text-[#E63946] flex-shrink-0">
                    {formatRupiah(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
