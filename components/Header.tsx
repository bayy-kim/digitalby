'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Sparkles } from 'lucide-react'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 border-b-4 border-[#121212] py-3 px-4 ${
        isScrolled
          ? 'bg-[#FFEE00]/85 backdrop-blur-md shadow-[0_6px_12px_rgba(18,18,18,0.15)] py-2.5'
          : 'bg-[#FFEE00] shadow-[0_4px_0_#121212]'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-[#E63946] text-white p-1.5 border-2 border-[#121212] shadow-[2px_2px_0_#121212] rounded transform -rotate-3 group-hover:rotate-0 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="font-comic text-2xl tracking-wider text-[#121212] block leading-none">
              BAYU DIGITAL STORE
            </span>
            <span className="text-[10px] font-bold text-[#121212] uppercase tracking-widest block">
              Serba Otomatis & Instan
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/#katalog"
            className="comic-btn-primary text-xs py-1.5 px-3"
          >
            <Sparkles className="w-4 h-4" />
            <span>Katalog</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
