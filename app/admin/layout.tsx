import type { Metadata } from 'next'
import { auth } from '@/auth'
import Link from 'next/link'
import { ShieldCheck, Package, ShoppingBag, History, LogOut, LayoutDashboard, DollarSign } from 'lucide-react'
import { AdminMobileBottomNav } from '@/components/AdminMobileBottomNav'

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
        <header className="bg-[#121212] text-white border-b-4 border-[#FFEE00] py-3 px-4 shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            {/* Left: Title & Logo */}
            <div className="flex items-center gap-2">
              <div className="p-1 bg-[#FFEE00] text-[#121212] font-bold rounded border-2 border-white flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#121212]" />
              </div>
              <span className="font-comic text-lg sm:text-xl text-[#FFEE00] tracking-wider truncate">
                ADMIN BAYU DIGITAL STORE
              </span>
            </div>

            {/* Middle: Desktop Nav Links (Hidden on Mobile) */}
            <nav className="hidden sm:flex items-center gap-2">
              <Link
                href="/admin"
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
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
                href="/admin/keuangan"
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-[#FFEE00]" />
                <span>Keuangan</span>
              </Link>
              <Link
                href="/admin/log"
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Log</span>
              </Link>
            </nav>

            {/* Right: Sign Out Button */}
            <div className="flex items-center flex-shrink-0">
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-2.5 py-1.5 text-xs font-bold bg-[#E63946] text-white hover:bg-red-700 rounded border border-white flex items-center gap-1.5 shadow-[2px_2px_0_#121212]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Keluar</span>
                </button>
              </form>
            </div>
          </div>
        </header>
      )}

      {/* Main Content with bottom padding for mobile bottombar */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20 sm:pb-6">
        {children}
      </main>

      {/* Mobile Bottombar */}
      {session && <AdminMobileBottomNav />}
    </div>
  )
}
