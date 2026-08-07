import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductManager } from './ProductManager'

export const revalidate = 0

export default async function AdminProductsPage() {
  const session = await auth()
  if (!session) {
    redirect('/admin/login')
  }

  const products = await prisma.product.findMany({
    include: {
      files: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="border-b-3 border-[#121212] pb-4">
        <h1 className="font-comic text-3xl text-[#121212]">KELOLA PRODUK DIGITAL</h1>
        <p className="text-xs text-gray-600 font-body">
          Tambah, edit, dan hapus katalog produk digital, lisensi akses (Multi-User / Eksklusif 1 Orang), serta upload massal dengan 1 cover bersama.
        </p>
      </div>

      <ProductManager initialProducts={JSON.parse(JSON.stringify(products))} />
    </div>
  )
}
