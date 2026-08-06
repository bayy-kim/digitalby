'use client'

import { motion } from 'framer-motion'
import { ArrowDown, Zap, FileText, ShieldCheck, Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative bg-[#FFEE00] border-b-4 border-[#121212] py-12 sm:py-16 px-4 halftone-pattern-subtle overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        
        {/* Top Badge: Spring Pop Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className="inline-block bg-[#E63946] text-white text-xs sm:text-sm font-bold uppercase tracking-widest px-3.5 py-1.5 border-2 border-[#121212] shadow-[3px_3px_0_#121212] rounded mb-4"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FFEE00]" />
            <span>Toko Produk Digital Terpercaya</span>
          </span>
        </motion.div>

        {/* H1 Headline: Comic BOOM Scale & Entrance */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.25 }}
          className="font-comic text-4xl sm:text-6xl lg:text-7xl text-[#121212] leading-none mb-5 uppercase tracking-wide"
        >
          PRODUK DIGITAL INSTAN{' '}
          <span className="inline-block bg-[#121212] text-[#FFEE00] px-2 py-0.5 rounded transform rotate-1 border-2 border-[#121212] shadow-[3px_3px_0_#E63946]">
            UNLOCK
          </span>{' '}
          SETELAH BAYAR!
        </motion.h1>

        {/* Subtitle Box: Slide Up Entrance */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="font-body text-sm sm:text-base lg:text-lg text-[#121212] max-w-2xl mx-auto font-medium mb-8 bg-white border-3 border-[#121212] p-4 rounded-xl shadow-[4px_4px_0_#121212]"
        >
          Dapatkan template, ebook, dan dokumen digital secara langsung. Bayar dengan QRIS, verifikasi otomatis 24 jam tanpa tunggu admin!
        </motion.p>

        {/* Call to Action Button + Bouncing Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.55 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#katalog"
            className="comic-btn-primary text-base sm:text-lg py-3.5 px-7 shadow-[5px_5px_0_#121212] hover:shadow-[7px_7px_0_#121212]"
          >
            <span>Lihat Katalog Produk</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            >
              <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
          </a>
        </motion.div>

        {/* Feature Badges: Staggered Fade In */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-3 gap-2 max-w-lg mx-auto mt-8 pt-5 border-t-2 border-[#121212]/20"
        >
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold">
            <Zap className="w-4 h-4 text-[#E63946]" />
            <span>Proses Otomatis</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold">
            <FileText className="w-4 h-4 text-[#1D3557]" />
            <span>Format Lengkap</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold">
            <ShieldCheck className="w-4 h-4 text-[#E63946]" />
            <span>Aman &amp; Terenkripsi</span>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
