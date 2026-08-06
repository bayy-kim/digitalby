import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { OrderTable } from './OrderTable'

export const revalidate = 0

export default async function AdminOrdersPage() {
  const session = await auth()
  if (!session) {
    redirect('/admin/login')
  }

  const orders = await prisma.order.findMany({
    include: {
      product: {
        select: { title: true, slug: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="border-b-3 border-[#121212] pb-4">
        <h1 className="font-comic text-3xl text-[#121212]">RIWAYAT & DAFTAR TRANSAKSI</h1>
        <p className="text-xs text-gray-600 font-body">
          Lihat semua transaksi pembeli, status pembayaran QRIS, dan lakukan verifikasi manual jika diperlukan.
        </p>
      </div>

      <OrderTable initialOrders={JSON.parse(JSON.stringify(orders))} />
    </div>
  )
}
