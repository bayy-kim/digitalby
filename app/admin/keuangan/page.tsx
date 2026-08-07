import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FinancialLedger } from './FinancialLedger'

export const revalidate = 0

export default async function AdminKeuanganPage() {
  const session = await auth()
  if (!session) {
    redirect('/admin/login')
  }

  const paidOrders = await prisma.order.findMany({
    where: { status: 'PAID' },
    include: {
      product: {
        select: { title: true, category: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="border-b-3 border-[#121212] pb-4">
        <h1 className="font-comic text-3xl text-[#121212]">REKAP KEUANGAN &amp; OMZET TOKO</h1>
        <p className="text-xs text-gray-600 font-body">
          Wadah pencatatan kas digital, laporan omzet masuk (DANA &amp; SeaBank), serta riwayat pembayaran terkonfirmasi.
        </p>
      </div>

      <FinancialLedger orders={JSON.parse(JSON.stringify(paidOrders))} />
    </div>
  )
}
