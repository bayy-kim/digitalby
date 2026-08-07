'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Edit3, FileText, Upload, Check, X, Loader2, Layers, UserCheck, Users, ShieldCheck } from 'lucide-react'

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
  stock: number
  licenseType: 'MULTI_USER' | 'EXCLUSIVE_SINGLE'
  coverUrl: string
  category: string | null
  isActive: boolean
  files: ProductFile[]
  createdAt: string
}

export function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)

  // Single Product Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Batch Upload Modal State
  const [showBatchModal, setShowBatchModal] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Single Form State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('100')
  const [licenseType, setLicenseType] = useState<'MULTI_USER' | 'EXCLUSIVE_SINGLE'>('MULTI_USER')
  const [category, setCategory] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  // Batch Form State
  const [batchPrice, setBatchPrice] = useState('')
  const [batchCategory, setBatchCategory] = useState('')
  const [batchLicenseType, setBatchLicenseType] = useState<'MULTI_USER' | 'EXCLUSIVE_SINGLE'>('EXCLUSIVE_SINGLE')
  const [batchCoverFile, setBatchCoverFile] = useState<File | null>(null)
  const [batchSelectedFiles, setBatchSelectedFiles] = useState<File[]>([])

  const openCreateModal = () => {
    setEditingProduct(null)
    setTitle('')
    setSlug('')
    setDescription('')
    setPrice('')
    setStock('100')
    setLicenseType('MULTI_USER')
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
    setStock(String(p.stock))
    setLicenseType(p.licenseType || 'MULTI_USER')
    setCategory(p.category || '')
    setIsActive(p.isActive)
    setCoverFile(null)
    setSelectedFiles([])
    setError(null)
    setShowModal(true)
  }

  const openBatchModal = () => {
    setBatchPrice('')
    setBatchCategory('')
    setBatchLicenseType('EXCLUSIVE_SINGLE')
    setBatchCoverFile(null)
    setBatchSelectedFiles([])
    setError(null)
    setShowBatchModal(true)
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

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('slug', slug)
      formData.append('description', description)
      formData.append('price', price)
      formData.append('stock', licenseType === 'EXCLUSIVE_SINGLE' ? '1' : stock)
      formData.append('licenseType', licenseType)
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

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchCoverFile) {
      setError('Satu Gambar Cover bersama wajib diunggah')
      return
    }
    if (batchSelectedFiles.length === 0) {
      setError('Minimal 1 file produk harus dipilih')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('price', batchPrice)
      formData.append('category', batchCategory)
      formData.append('licenseType', batchLicenseType)
      formData.append('stock', batchLicenseType === 'EXCLUSIVE_SINGLE' ? '1' : '100')
      formData.append('cover', batchCoverFile)

      batchSelectedFiles.forEach((file) => {
        formData.append('files', file)
      })

      const res = await fetch('/api/admin/products/batch', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan batch produk')
      }

      setShowBatchModal(false)
      router.refresh()

      const fetchRes = await fetch('/api/admin/products')
      if (fetchRes.ok) {
        const fresh = await fetchRes.json()
        setProducts(fresh)
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat batch upload')
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  return (
    <div className="space-y-6">
      {/* Top Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={openBatchModal}
          className="comic-btn-dark text-xs py-2 px-4 shadow-[3px_3px_0_#E63946]"
        >
          <Layers className="w-4 h-4 text-[#FFEE00]" />
          <span>Upload Massal (1 Cover, N File)</span>
        </button>

        <button
          onClick={openCreateModal}
          className="comic-btn-yellow text-xs py-2 px-4 shadow-[3px_3px_0_#121212]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah 1 Produk Tunggal</span>
        </button>
      </div>

      {/* Product List Table / Grid */}
      <div className="comic-panel bg-white p-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-body border-collapse">
          <thead>
            <tr className="border-b-3 border-[#121212] bg-[#FFEE00] font-comic text-sm">
              <th className="p-3">Cover</th>
              <th className="p-3">Judul &amp; Slug</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Tipe Akses</th>
              <th className="p-3">Harga</th>
              <th className="p-3">Stok</th>
              <th className="p-3">Berkas</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500 font-bold">
                  Belum ada produk. Klik "Tambah Produk" atau "Upload Massal" di atas.
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
                  <td className="p-3">
                    {p.licenseType === 'EXCLUSIVE_SINGLE' ? (
                      <span className="comic-badge bg-[#E63946] text-white flex items-center gap-1 w-max">
                        <UserCheck className="w-3 h-3" />
                        <span>Eksklusif (1 Orang)</span>
                      </span>
                    ) : (
                      <span className="comic-badge bg-[#1D3557] text-white flex items-center gap-1 w-max">
                        <Users className="w-3 h-3" />
                        <span>Banyak Orang</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-comic text-sm text-[#121212]">{formatRupiah(p.price)}</td>
                  <td className="p-3">
                    {p.stock <= 0 ? (
                      <span className="comic-badge bg-red-600 text-white">0 (SOLD OUT)</span>
                    ) : (
                      <span className="font-bold text-[#121212]">{p.stock} pcs</span>
                    )}
                  </td>
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

      {/* Modal Single Product Form Add/Edit */}
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

            <form onSubmit={handleSubmitSingle} className="space-y-4 text-xs font-body">
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

              {/* Tipe Akses / Lisensi Option */}
              <div className="p-3 bg-yellow-50 border-2 border-[#121212] rounded space-y-2">
                <span className="font-bold text-gray-800 block uppercase text-[11px]">
                  Tipe Akses Pembelian (Lisensi):
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-2 border-2 rounded cursor-pointer ${licenseType === 'MULTI_USER' ? 'bg-[#FFEE00] border-[#121212] font-bold' : 'bg-white border-gray-300'}`}>
                    <input
                      type="radio"
                      name="licenseType"
                      value="MULTI_USER"
                      checked={licenseType === 'MULTI_USER'}
                      onChange={() => setLicenseType('MULTI_USER')}
                      className="accent-[#E63946]"
                    />
                    <div>
                      <span className="block text-xs">Untuk Banyak Orang</span>
                      <span className="text-[9px] text-gray-600 block">Dapat dibeli berulang kali</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2 border-2 rounded cursor-pointer ${licenseType === 'EXCLUSIVE_SINGLE' ? 'bg-[#E63946] text-white border-[#121212] font-bold' : 'bg-white border-gray-300'}`}>
                    <input
                      type="radio"
                      name="licenseType"
                      value="EXCLUSIVE_SINGLE"
                      checked={licenseType === 'EXCLUSIVE_SINGLE'}
                      onChange={() => setLicenseType('EXCLUSIVE_SINGLE')}
                      className="accent-[#FFEE00]"
                    />
                    <div>
                      <span className="block text-xs">Eksklusif (1 Orang)</span>
                      <span className="text-[9px] block opacity-90">Auto Sold Out begitu 1x lunas</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="template-excel"
                    className="w-full px-3 py-2 border-2 border-[#121212] rounded font-mono focus:ring-2 focus:ring-[#FFEE00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Harga (Rupiah)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 border-2 border-[#121212] rounded font-mono focus:ring-2 focus:ring-[#FFEE00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Stok Barang</label>
                  <input
                    type="number"
                    required
                    min={0}
                    disabled={licenseType === 'EXCLUSIVE_SINGLE'}
                    value={licenseType === 'EXCLUSIVE_SINGLE' ? 1 : stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 border-2 border-[#121212] rounded font-mono focus:ring-2 focus:ring-[#FFEE00] focus:outline-none disabled:bg-gray-100"
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
                <label className="block font-bold text-gray-700 uppercase mb-1">Cover Image (Upload Gambar)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border-2 border-[#121212] rounded bg-gray-50"
                />
              </div>

              {/* Upload Berkas Produk */}
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
              </div>

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

      {/* BATCH UPLOAD MODAL (1 Cover Image, N Files -> N Products) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="comic-panel bg-white p-6 max-w-xl w-full my-8 space-y-4">
            <div className="flex items-center justify-between border-b-3 border-[#121212] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-6 h-6 text-[#E63946]" />
                <h2 className="font-comic text-2xl text-[#121212]">
                  UPLOAD MASSAL (1 COVER, BANYAK FILE)
                </h2>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 bg-gray-200 border-2 border-[#121212] rounded hover:bg-gray-300"
              >
                <X className="w-5 h-5 text-[#121212]" />
              </button>
            </div>

            <p className="text-xs text-gray-700 font-body">
              Unggah 1 gambar cover bersama dan pilih banyak file sekaligus. Sistem akan otomatis membuat setiap file menjadi 1 produk mandiri di katalog!
            </p>

            {error && (
              <div className="p-3 bg-red-100 border-2 border-[#121212] rounded text-xs text-red-800 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitBatch} className="space-y-4 text-xs font-body">
              {/* Cover Upload Shared */}
              <div className="p-3 bg-[#FFEE00]/30 border-2 border-[#121212] rounded">
                <label className="block font-bold text-gray-800 uppercase mb-1">
                  1. Upload 1 Gambar Cover Bersama (Wajib)
                </label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => setBatchCoverFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border-2 border-[#121212] rounded bg-white"
                />
              </div>

              {/* Multiple Files Upload */}
              <div className="p-3 bg-blue-50 border-2 border-[#121212] rounded">
                <label className="block font-bold text-gray-800 uppercase mb-1">
                  2. Pilih Banyak File Produk Sekaligus (.TXT, .PDF, .DOCX)
                </label>
                <input
                  type="file"
                  required
                  multiple
                  accept=".txt,.pdf,.docx,.doc"
                  onChange={(e) => setBatchSelectedFiles(Array.from(e.target.files || []))}
                  className="w-full p-2 border-2 border-[#121212] rounded bg-white"
                />
                <span className="text-[10px] text-gray-600 block mt-1">
                  Terpilih: <strong>{batchSelectedFiles.length} file</strong>. Setiap file akan jadi 1 produk terpisah.
                </span>
              </div>

              {/* Shared Properties */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Harga Seragam (Rp)</label>
                  <input
                    type="number"
                    required
                    value={batchPrice}
                    onChange={(e) => setBatchPrice(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3 py-2 border-2 border-[#121212] rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Kategori Seragam</label>
                  <input
                    type="text"
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    placeholder="Template / Ebook"
                    className="w-full px-3 py-2 border-2 border-[#121212] rounded"
                  />
                </div>
              </div>

              {/* Shared License Type */}
              <div className="p-3 bg-gray-50 border-2 border-[#121212] rounded space-y-2">
                <span className="font-bold text-gray-800 block uppercase text-[10px]">
                  Tipe Akses Semua Produk Dalam Batch Ini:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-2 border-2 rounded cursor-pointer ${batchLicenseType === 'EXCLUSIVE_SINGLE' ? 'bg-[#E63946] text-white border-[#121212] font-bold' : 'bg-white border-gray-300'}`}>
                    <input
                      type="radio"
                      name="batchLicenseType"
                      value="EXCLUSIVE_SINGLE"
                      checked={batchLicenseType === 'EXCLUSIVE_SINGLE'}
                      onChange={() => setBatchLicenseType('EXCLUSIVE_SINGLE')}
                      className="accent-[#FFEE00]"
                    />
                    <div>
                      <span className="block text-xs">Eksklusif (1 Orang/File)</span>
                      <span className="text-[9px] block opacity-90">Auto Sold Out begitu 1x lunas</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2 border-2 rounded cursor-pointer ${batchLicenseType === 'MULTI_USER' ? 'bg-[#FFEE00] border-[#121212] font-bold' : 'bg-white border-gray-300'}`}>
                    <input
                      type="radio"
                      name="batchLicenseType"
                      value="MULTI_USER"
                      checked={batchLicenseType === 'MULTI_USER'}
                      onChange={() => setBatchLicenseType('MULTI_USER')}
                      className="accent-[#E63946]"
                    />
                    <div>
                      <span className="block text-xs">Bisa Dibeli Banyak Orang</span>
                      <span className="text-[9px] text-gray-600 block">Stok awal 100</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-gray-200 border-2 border-[#121212] font-bold rounded hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="comic-btn-dark text-xs py-2 px-5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>MEMPROSES BATCH...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4 text-[#FFEE00]" />
                      <span>PROSES BATCH UPLOAD</span>
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
