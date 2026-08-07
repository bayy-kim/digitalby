'use client'

import { useState } from 'react'
import { MessageCircle, Mail, ShieldCheck, Zap, Search } from 'lucide-react'
import { OrderLookupModal } from './OrderLookupModal'

export function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const waDisplay = process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY || ''
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || ''

  return (
    <>
      <footer className="bg-[#121212] text-white border-t-4 border-[#121212] mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <h3 className="font-comic text-xl text-[#FFEE00] mb-2 tracking-wide">
                BAYU DIGITAL STORE
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-body mb-3">
                Platform penjualan produk digital otomatis (template, ebook, dokumen). Sistem langsung mengaktifkan tautan unduhan secara otomatis setelah pembayaran terverifikasi.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#121212] bg-[#FFEE00] border-2 border-white px-3 py-1.5 rounded shadow-[2px_2px_0_#ffffff] hover:bg-yellow-400 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cek Status Pesanan Saya</span>
              </button>
            </div>

            <div>
              <h4 className="font-comic text-lg text-[#FFEE00] mb-2">
                LAYANAN &amp; KEAMANAN
              </h4>
              <ul className="text-xs text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FFEE00]" />
                  <span>Pembayaran QRIS DANA &amp; Transfer SeaBank 24/7</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#E63946]" />
                  <span>Penyimpanan Berkas Aman &amp; Enkripsi Token</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-comic text-lg text-[#FFEE00] mb-2">
                HUBUNGI KAMI
              </h4>
              <div className="flex flex-col gap-2">
                {waNumber && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs bg-[#25D366] text-[#121212] font-bold px-3 py-2 border-2 border-white rounded shadow-[2px_2px_0_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp: {waDisplay || waNumber}</span>
                  </a>
                )}
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-2 text-xs bg-white text-[#121212] font-bold px-3 py-2 border-2 border-white rounded shadow-[2px_2px_0_#E63946] hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
                  >
                    <Mail className="w-4 h-4 text-[#E63946]" />
                    <span>Email: {contactEmail}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 font-body">
            <p>&copy; {new Date().getFullYear()} Bayu Digital Store. Hak Cipta Dilindungi.</p>
            <p className="mt-2 sm:mt-0">Dibuat dengan gaya Komik Modern untuk Akses Mobile Cepat.</p>
          </div>
        </div>
      </footer>

      <OrderLookupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
