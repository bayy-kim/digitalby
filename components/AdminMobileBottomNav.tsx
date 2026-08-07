'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, DollarSign, History } from 'lucide-react'

export function AdminMobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Produk',
      href: '/admin/produk',
      icon: Package,
      exact: false,
    },
    {
      label: 'Transaksi',
      href: '/admin/order',
      icon: ShoppingBag,
      exact: false,
    },
    {
      label: 'Keuangan',
      href: '/admin/keuangan',
      icon: DollarSign,
      exact: false,
    },
    {
      label: 'Audit Log',
      href: '/admin/log',
      icon: History,
      exact: false,
    },
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121212] border-t-4 border-[#FFEE00] px-1 py-1.5 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
      <div className="grid grid-cols-5 gap-0.5 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded transition-colors ${
                isActive
                  ? 'bg-[#FFEE00] text-[#121212] font-extrabold shadow-[2px_2px_0_#ffffff]'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#121212]' : 'text-gray-300'}`} />
              <span className="text-[9px] tracking-tighter truncate font-body">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
