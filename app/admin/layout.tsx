import type { Metadata } from 'next'
import { auth } from '@/auth'
import Link from 'next/link'
import { ShieldCheck, Package, ShoppingBag, History, LogOut } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Panel - Bayu Digital Store',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-body">
      {session && (
        <header className="bg-[#121212] text-white border-b-4 border-[#FFEE00] py-3 px-4 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#FFEE00] text-[#121212] font-bold rounded border-2 border-white">
                <ShieldCheck className="w-5 h-5 text-[#121212]" />
              </div>
              <span className="font-comic text-xl text-[#FFEE00] tracking-wider">
                ADMIN BAYU DIGITAL STORE
              </span>
            </div>

            <nav className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <Link
                href="/admin"
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1.5"
              >
                <span>Dashboard</span>
              </Link>
              <Link
                href="/admin/produk"
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Kelola Produk</span>
              </Link>
              <Link
                href="/admin/order"
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Transaksi</span>
              </Link>
              <Link
                href="/admin/log"
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Log</span>
              </Link>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold bg-[#E63946] text-white hover:bg-red-700 rounded flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </form>
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  )
}
