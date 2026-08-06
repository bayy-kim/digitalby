import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const revalidate = 0 // Dynamic catalog

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      files: {
        select: { mimeType: true, fileName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Format currency Helper
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get File Badges (.PDF, .TXT, .DOCX)
  const getFileExtensionBadge = (files: { fileName: string }[]) => {
    if (!files || files.length === 0) return 'FILE'
    const exts = Array.from(
      new Set(
        files.map((f) => {
          const parts = f.fileName.split('.')
          return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE'
        })
      )
    )
    return exts.join(' / ')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION - Comic Modern Style with Animations */}
        <HeroSection />

        {/* CATALOG SECTION */}
        <section id="katalog" className="py-12 px-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-comic text-3xl text-[#121212] tracking-wide uppercase">
                KATALOG PRODUK DIGITAL
              </h2>
              <p className="text-xs text-gray-600 font-body font-medium">
                Pilih produk yang Anda butuhkan dan unduh secara instan
              </p>
            </div>
            <span className="comic-badge bg-[#FFEE00] text-[#121212]">
              {products.length} Produk
            </span>
          </div>

          {products.length === 0 ? (
            /* Empty State in Comic Style */
            <div className="comic-panel p-8 text-center max-w-md mx-auto my-8 bg-white">
              <div className="inline-block p-4 bg-[#FFEE00] border-3 border-[#121212] rounded-full mb-4 shadow-[3px_3px_0_#121212]">
                <FileText className="w-12 h-12 text-[#121212]" />
              </div>
              <h3 className="font-comic text-2xl text-[#121212] mb-2 uppercase">
                BELUM ADA PRODUK!
              </h3>
              <p className="text-xs text-gray-700 font-body mb-6">
                Katalog produk saat ini masih kosong. Silakan kembali lagi nanti untuk melihat koleksi template & ebook terbaru kami.
              </p>
              <div className="comic-bubble bg-[#F8F9FA] text-xs font-bold text-center">
                Admin sedang menyiapkan produk-produk digital spesial untuk Anda!
              </div>
            </div>
          ) : (
            /* Product Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const extBadge = getFileExtensionBadge(product.files)
                const isSoldOut = product.stock <= 0

                return (
                  <div key={product.id} className={`comic-card flex flex-col h-full bg-white overflow-hidden relative ${isSoldOut ? 'opacity-90' : ''}`}>
                    {/* Cover image container */}
                    <div className="relative aspect-video w-full bg-[#FFEE00] border-b-3 border-[#121212] overflow-hidden">
                      {product.coverUrl ? (
                        <img
                          src={product.coverUrl}
                          alt={product.title}
                          className={`w-full h-full object-cover ${isSoldOut ? 'grayscale contrast-125' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-comic text-lg">
                          BAYU STORE
                        </div>
                      )}
                      
                      {/* Format Badge */}
                      <span className="absolute top-2 right-2 comic-badge bg-[#121212] text-white">
                        {extBadge}
                      </span>

                      {/* Sold Out Overlay Badge if stock 0 */}
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="font-comic text-2xl text-white bg-[#E63946] border-3 border-[#121212] px-4 py-1.5 shadow-[4px_4px_0_#121212] transform -rotate-6 uppercase tracking-wider">
                            SOLD OUT
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          {product.category && (
                            <span className="text-[10px] font-bold text-[#E63946] uppercase tracking-wider block">
                              {product.category}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isSoldOut ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                            {isSoldOut ? 'Stok: 0' : `Stok: ${product.stock}`}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-[#121212] line-clamp-2 leading-snug mb-2">
                          {product.title}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-4 font-body">
                          {product.description}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between mb-3 pt-2 border-t border-gray-200">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Harga</span>
                          <span className="font-comic text-xl text-[#E63946]">
                            {formatRupiah(product.price)}
                          </span>
                        </div>

                        {isSoldOut ? (
                          <button
                            disabled
                            className="w-full text-xs text-center py-2 px-3 bg-gray-300 text-gray-700 font-comic font-bold border-2 border-[#121212] rounded cursor-not-allowed uppercase shadow-[2px_2px_0_#121212]"
                          >
                            SOLD OUT (HABIS)
                          </button>
                        ) : (
                          <Link
                            href={`/produk/${product.slug}`}
                            className="comic-btn-yellow w-full text-xs text-center py-2"
                          >
                            Lihat Detail
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
