import { MessageCircle, Mail, ShieldCheck, Zap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#121212] text-white border-t-4 border-[#121212] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <h3 className="font-comic text-xl text-[#FFEE00] mb-2 tracking-wide">
              BAYU DIGITAL STORE
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-body">
              Platform penjualan produk digital otomatis (template, ebook, dokumen). Sistem langsung mengaktifkan tautan unduhan secara otomatis setelah pembayaran QRIS Anda terverifikasi.
            </p>
          </div>

          <div>
            <h4 className="font-comic text-lg text-[#FFEE00] mb-2">
              LAYANAN & KEAMANAN
            </h4>
            <ul className="text-xs text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFEE00]" />
                <span>QRIS Instan Serba Otomatis 24/7</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E63946]" />
                <span>Penyimpanan Berkas Aman & Enkripsi Token</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-comic text-lg text-[#FFEE00] mb-2">
              HUBUNGI KAMI
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href="https://wa.me/6285317126862"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs bg-[#25D366] text-[#121212] font-bold px-3 py-2 border-2 border-white rounded shadow-[2px_2px_0_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: 085317126862</span>
              </a>
              <a
                href="mailto:muhamadaibayu@gmail.com"
                className="inline-flex items-center gap-2 text-xs bg-white text-[#121212] font-bold px-3 py-2 border-2 border-white rounded shadow-[2px_2px_0_#E63946] hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
              >
                <Mail className="w-4 h-4 text-[#E63946]" />
                <span>Email: muhamadaibayu@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 font-body">
          <p>&copy; {new Date().getFullYear()} Bayu Digital Store. Hak Cipta Dilindungi.</p>
          <p className="mt-2 sm:mt-0">Dibuat dengan gaya Komik Modern untuk Akses Mobile Cepat.</p>
        </div>
      </div>
    </footer>
  )
}
