'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, FileText } from 'lucide-react'

interface ProductFile {
  mimeType: string
  fileName: string
}

interface ProductItem {
  id: string
  slug: string
  title: string
  description: string
  price: number
  stock: number
  coverUrl: string
  category: string | null
  files: ProductFile[]
}

export function CatalogSearch({ products }: { products: ProductItem[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua')

  // Extract unique categories
  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]]

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getFileExtensionBadge = (files: ProductFile[]) => {
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

  // Filter products by search query and selected category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === 'Semua' || product.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Search Bar & Category Filter Pills */}
      <div className="space-y-4 bg-white p-4 sm:p-5 border-3 border-[#121212] rounded-xl shadow-[4px_4px_0_#121212]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk digital (contoh: Excel, TikTok, Ebook)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border-2 border-[#121212] rounded-lg font-body focus:ring-2 focus:ring-[#FFEE00] focus:outline-none"
          />
          <Search className="w-5 h-5 text-gray-500 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs font-bold text-gray-400 hover:text-gray-700"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-gray-500 uppercase flex-shrink-0 mr-1">
            Kategori:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`comic-badge transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#E63946] text-white border-2 border-[#121212] shadow-[2px_2px_0_#121212]'
                    : 'bg-[#F8F9FA] text-[#121212] border-2 border-[#121212] hover:bg-[#FFEE00]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Catalog Header Info */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="font-comic text-xl text-[#121212] uppercase">
          MENAMPILKAN {filteredProducts.length} PRODUK
        </h3>
        {selectedCategory !== 'Semua' && (
          <span className="comic-badge bg-[#FFEE00] text-[#121212]">
            Filter: {selectedCategory}
          </span>
        )}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="comic-panel p-8 text-center max-w-md mx-auto my-8 bg-white space-y-3">
          <div className="inline-block p-4 bg-[#FFEE00] border-3 border-[#121212] rounded-full shadow-[3px_3px_0_#121212]">
            <FileText className="w-10 h-10 text-[#121212]" />
          </div>
          <h4 className="font-comic text-2xl text-[#121212] uppercase">
            PRODUK TIDAK DITEMUKAN!
          </h4>
          <p className="text-xs text-gray-700 font-body">
            Tidak ada produk yang cocok dengan pencarian "{searchQuery}". Coba kata kunci lain atau reset filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('Semua')
            }}
            className="comic-btn-primary text-xs py-2 px-4"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const extBadge = getFileExtensionBadge(product.files)
            const isSoldOut = product.stock <= 0

            return (
              <div
                key={product.id}
                className={`comic-card flex flex-col h-full bg-white overflow-hidden relative ${
                  isSoldOut ? 'opacity-90' : ''
                }`}
              >
                {/* Cover image container */}
                <div className="relative aspect-video w-full bg-[#FFEE00] border-b-3 border-[#121212] overflow-hidden">
                  {product.coverUrl ? (
                    <img
                      src={product.coverUrl}
                      alt={product.title}
                      className={`w-full h-full object-cover ${
                        isSoldOut ? 'grayscale contrast-125' : ''
                      }`}
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

                  {/* Sold Out Overlay Badge */}
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
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          isSoldOut
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : 'bg-green-100 text-green-800 border-green-300'
                        }`}
                      >
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
    </div>
  )
}
