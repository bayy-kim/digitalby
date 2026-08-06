import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { FileText, CheckCircle2, ShieldCheck, Zap, Lock, ArrowLeft, PackageCheck } from 'lucide-react'
import Link from 'next/link'
import { BuyButton } from './BuyButton'

export const revalidate = 0

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      files: true,
    },
  })

  if (!product || !product.isActive) {
    notFound()
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalSizeBytes = product.files.reduce((acc, f) => acc + f.sizeBytes, 0)
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const fileExtensions = Array.from(
    new Set(
      product.files.map((f) => {
        const parts = f.fileName.split('.')
        return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE'
      })
    )
  ).join(', ')

  const isSoldOut = product.stock <= 0

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header />

      <main className="flex-1 py-8 px-4 max-w-4xl mx-auto w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#121212] bg-white border-2 border-[#121212] px-3 py-1.5 rounded shadow-[2px_2px_0_#121212] hover:bg-[#FFEE00] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Image & File Specs */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="comic-panel p-2 bg-white overflow-hidden relative">
              <div className="aspect-video sm:aspect-square w-full bg-[#FFEE00] border-2 border-[#121212] rounded overflow-hidden relative">
                {product.coverUrl ? (
                  <img
                    src={product.coverUrl}
                    alt={product.title}
                    className={`w-full h-full object-cover ${isSoldOut ? 'grayscale contrast-125' : ''}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-comic text-2xl text-gray-500">
                    BAYU STORE
                  </div>
                )}

                {isSoldOut && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="font-comic text-3xl text-white bg-[#E63946] border-3 border-[#121212] px-6 py-2 shadow-[4px_4px_0_#121212] transform -rotate-6 uppercase tracking-wider">
                      SOLD OUT
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Spec Box */}
            <div className="comic-panel p-4 bg-white space-y-3">
              <h3 className="font-comic text-lg text-[#121212] border-b-2 border-[#121212] pb-1">
                INFORMASI FILE
              </h3>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-bold">Stok Barang:</span>
                {isSoldOut ? (
                  <span className="comic-badge bg-red-600 text-white">0 (SOLD OUT)</span>
                ) : (
                  <span className="comic-badge bg-green-500 text-white">{product.stock} Tersedia</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-bold">Format Berkas:</span>
                <span className="comic-badge bg-[#FFEE00] text-[#121212]">
                  {fileExtensions || 'LENGKAP'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-bold">Jumlah Berkas:</span>
                <span className="font-bold text-[#121212]">
                  {product.files.length} File
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-bold">Total Ukuran:</span>
                <span className="font-bold text-[#121212]">
                  {formatSize(totalSizeBytes)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-bold">Metode Akses:</span>
                <span className="font-bold text-[#E63946]">
                  Unduh Langsung (QRIS)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Price, Buy Action */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <div className="comic-panel p-6 bg-white space-y-4">
              <div className="flex items-center justify-between gap-2">
                {product.category && (
                  <span className="inline-block comic-badge bg-[#E63946] text-white">
                    {product.category}
                  </span>
                )}
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isSoldOut ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                  {isSoldOut ? 'Stok Habis' : `Sisa Stok: ${product.stock}`}
                </span>
              </div>

              <h1 className="font-comic text-3xl sm:text-4xl text-[#121212] leading-tight">
                {product.title}
              </h1>

              <div className="p-4 bg-[#FFEE00] border-3 border-[#121212] rounded-lg shadow-[3px_3px_0_#121212] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#121212] block">
                    Harga Pembelian Instan
                  </span>
                  <span className="font-comic text-3xl text-[#121212]">
                    {formatRupiah(product.price)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-[#121212] text-white font-bold px-2 py-0.5 rounded uppercase">
                    Tanpa Biaya Tambahan
                  </span>
                </div>
              </div>

              {/* Buy Form Client Component */}
              <BuyButton productId={product.id} price={product.price} title={product.title} stock={product.stock} />
            </div>

            {/* Description & Features */}
            <div className="comic-panel p-6 bg-white space-y-4">
              <h2 className="font-comic text-xl text-[#121212] border-b-2 border-[#121212] pb-2">
                DESKRIPSI PRODUK
              </h2>
              <div className="text-xs sm:text-sm text-gray-800 leading-relaxed font-body whitespace-pre-line">
                {product.description}
              </div>

              <div className="mt-6 pt-4 border-t-2 border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Akses File Selamanya Setelah Pembayaran</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Zap className="w-4 h-4 text-[#FFEE00]" />
                  <span>Proses Otomatis QRIS Tanpa Tunggu Verifikasi Manual</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-[#E63946]" />
                  <span>File Asli Tersimpan Aman di Storage Terenkripsi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
