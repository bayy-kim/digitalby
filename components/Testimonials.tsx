import { Star, MessageSquareQuote } from 'lucide-react'

export function Testimonials() {
  const reviews = [
    {
      name: 'Rian S.',
      role: 'Content Creator TikTok',
      avatar: '🎨',
      rating: 5,
      comment: 'Beli checklist konten TikTok 30 hari langsung dapat file setelah bayar QRIS. Gak pakai nunggu admin bales WA!',
    },
    {
      name: 'Dewi K.',
      role: 'Pemilik UMKM Olshop',
      avatar: '💼',
      rating: 5,
      comment: 'Template Laporan Keuangan Excel-nya sangat membantu! Rumus sudah otomatis, tinggal masukkan angka pemasukan.',
    },
    {
      name: 'Bagus A.',
      role: 'Job Seeker',
      avatar: '🚀',
      rating: 5,
      comment: 'Format surat lamarannya rapi banget & ATS-friendly. Begitu bayar via QRIS ShopeePay langsung kere-direct ke file unduhan.',
    },
  ]

  return (
    <section className="py-12 px-4 bg-[#FFEE00]/15 border-t-4 border-b-4 border-[#121212] halftone-pattern-subtle">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block bg-[#121212] text-[#FFEE00] text-xs font-bold uppercase tracking-widest px-3 py-1 border-2 border-[#121212] rounded shadow-[2px_2px_0_#E63946] transform -rotate-1">
            TESTIMONI PEMBELI
          </div>
          <h2 className="font-comic text-3xl sm:text-4xl text-[#121212] uppercase tracking-wide">
            APA KATA MEREKA?
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-body max-w-md mx-auto">
            Ulasan jujur dari pembeli yang telah merasakan kepraktisan sistem unduh instan kami.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div key={idx} className="flex flex-col justify-between">
              {/* Comic Speech Bubble */}
              <div className="comic-bubble bg-white mb-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#FFEE00]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#121212] text-[#121212]" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-800 font-body leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-[#FFEE00] border-2 border-[#121212] rounded-full flex items-center justify-center text-lg shadow-[2px_2px_0_#121212]">
                  {rev.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#121212]">{rev.name}</h4>
                  <span className="text-[10px] text-gray-600 font-body font-medium block">
                    {rev.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
