'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Edit3, FileText, Upload, Check, X, Loader2, FileCheck, Eye } from 'lucide-react'

interface ProductFile {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  blobUrl: string
}

interface Product {
  id: string
  slug: string
  title: string
  description: string
  price: number
  coverUrl: string
  category: string | null
  isActive: boolean
  files: ProductFile[]
  createdAt: string
}

export function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const openCreateModal = () => {
    setEditingProduct(null)
    setTitle('')
    setSlug('')
    setDescription('')
    setPrice('')
    setCategory('')
    setIsActive(true)
    setCoverFile(null)
    setSelectedFiles([])
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setTitle(p.title)
    setSlug(p.slug)
    setDescription(p.description)
    setPrice(String(p.price))
    setCategory(p.category || '')
    setIsActive(p.isActive)
    setCoverFile(null)
    setSelectedFiles([])
    setError(null)
    setShowModal(true)
  }

  const handleDelete = async (id: string, productTitle: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${productTitle}"?`)) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus produk')
      setProducts(products.filter((p) => p.id !== id))
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('slug', slug)
      formData.append('description', description)
      formData.append('price', price)
      formData.append('category', category)
      formData.append('isActive', String(isActive))

      if (coverFile) {
        formData.append('cover', coverFile)
      }

      selectedFiles.forEach((file) => {
        formData.append('files', file)
      })

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'

      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan produk')
      }

      setShowModal(false)
      router.refresh()
      // Refresh local list
      const fetchRes = await fetch('/api/admin/products')
      if (fetchRes.ok) {
        const fresh = await fetchRes.json()
        setProducts(fresh)
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={openCreateModal}
          className="comic-btn-yellow text-xs py-2 px-4 shadow-[3px_3px_0_#121212]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Product List Table / Grid */}
      <div className="comic-panel bg-white p-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-body border-collapse">
          <thead>
            <tr className="border-b-3 border-[#121212] bg-[#FFEE00] font-comic text-sm">
              <th className="p-3">Cover</th>
              <th className="p-3">Judul & Slug</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Harga</th>
              <th className="p-3">Berkas</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500 font-bold">
                  Belum ada produk. Klik "Tambah Produk Baru" di atas.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="w-12 h-12 bg-gray-100 border-2 border-[#121212] rounded overflow-hidden">
                      {p.coverUrl ? (
                        <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400">NO IMG</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-[#121212] block text-sm">{p.title}</span>
                    <span className="text-[10px] text-gray-500 font-mono">/produk/{p.slug}</span>
                  </td>
                  <td className="p-3 font-bold text-[#E63946]">{p.category || '-'}</td>
                  <td className="p-3 font-comic text-sm text-[#121212]">{formatRupiah(p.price)}</td>
                  <td className="p-3 font-bold">
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300">
                      <FileText className="w-3 h-3" />
                      <span>{p.files.length} File</span>
                    </span>
                  </td>
                  <td className="p-3">
                    {p.isActive ? (
                      <span className="comic-badge bg-green-500 text-white">Aktif</span>
                    ) : (
                      <span className="comic-badge bg-gray-400 text-white">Nonaktif</span>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 bg-[#FFEE00] border-2 border-[#121212] rounded shadow-[2px_2px_0_#121212] hover:bg-yellow-400"
                    >
                      <Edit3 className="w-4 h-4 text-[#121212]" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="p-1.5 bg-[#E63946] border-2 border-[#121212] rounded text-white shadow-[2px_2px_0_#121212] hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="comic-panel bg-white p-6 max-w-xl w-full my-8 space-y-4">
            <div className="flex items-center justify-between border-b-3 border-[#121212] pb-3">
              <h2 className="font-comic text-2xl text-[#121212]">
                {editingProduct ? 'EDIT PRODUK DIGITAL' : 'TAMBAH PRODUK BARU'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 bg-gray-200 border-2 border-[#121212] rounded hover:bg-gray-300"
              >
                <X className="w-5 h-5 text-[#121212]" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border-2 border-[#121212] rounded text-xs text-red-800 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Judul Produk</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Template Excel Laporan Keuangan"
                  className="w-full px-3 py-2 border-2 border-[#121212] rounded focus:ring-2 focus:ring-[#FFEE00] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Slug URL (Opsional)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="template-excel-keuangan"
                    className="w-full px-3 py-2 border-2 border-[#121212] rounded font-mono focus:ring-2 focus:ring-[#FFEE00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Harga (Rupiah Integer)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 border-2 border-[#121212] rounded font-mono focus:ring-2 focus:ring-[#FFEE00] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Kategori</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Template, Ebook, Dokumen, dsb."
                  className="w-full px-3 py-2 border-2 border-[#121212] rounded focus:ring-2 focus:ring-[#FFEE00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Deskripsi Lengkap</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan spesifikasi dan manfaat produk ini..."
                  className="w-full px-3 py-2 border-2 border-[#121212] rounded focus:ring-2 focus:ring-[#FFEE00] focus:outline-none"
                ></textarea>
              </div>

              {/* Cover Upload */}
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Cover Image (Upload Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border-2 border-[#121212] rounded bg-gray-50"
                />
              </div>

              {/* Existing Uploaded Files Preview */}
              {editingProduct && editingProduct.files.length > 0 && (
                <div className="p-3 bg-gray-100 border-2 border-[#121212] rounded space-y-2">
                  <span className="font-bold text-gray-700 block uppercase text-[10px]">File Produk Yang Sudah Tersimpan:</span>
                  <div className="space-y-1">
                    {editingProduct.files.map((f) => (
                      <div key={f.id} className="flex items-center justify-between text-[11px] bg-white p-1.5 border border-gray-300 rounded font-mono">
                        <span className="truncate max-w-xs">{f.fileName}</span>
                        <span className="text-gray-500 font-bold">{(f.sizeBytes / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Product Files (.txt, .pdf, .docx) */}
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Upload Berkas Produk (.TXT, .PDF, .DOCX)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".txt,.pdf,.docx,.doc"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                  className="w-full p-2 border-2 border-[#121212] rounded bg-gray-50"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Bisa pilih lebih dari 1 file. Sistem akan menggabungkannya jadi ZIP saat diunduh pembeli.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#E63946] border-2 border-[#121212]"
                />
                <label htmlFor="isActive" className="font-bold text-gray-800">
                  Tampilkan Produk Ini Di Katalog Publik
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 border-2 border-[#121212] font-bold rounded hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="comic-btn-primary text-xs py-2 px-5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>MENYIMPAN...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingProduct ? 'SIMPAN PERUBAHAN' : 'TAMBAH PRODUK'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
