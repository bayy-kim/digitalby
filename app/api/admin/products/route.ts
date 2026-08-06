import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.docx', '.doc']

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    include: {
      files: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()

    const title = formData.get('title') as string
    const slugInput = formData.get('slug') as string
    const description = formData.get('description') as string
    const priceStr = formData.get('price') as string
    const stockStr = (formData.get('stock') as string) || '100'
    const category = (formData.get('category') as string) || null
    const isActiveStr = formData.get('isActive') as string

    if (!title || !description || !priceStr) {
      return NextResponse.json({ error: 'Judul, deskripsi, dan harga wajib diisi' }, { status: 400 })
    }

    const price = parseInt(priceStr, 10)
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Harga harus berupa angka positif' }, { status: 400 })
    }

    const stock = parseInt(stockStr, 10)
    const validStock = isNaN(stock) || stock < 0 ? 0 : stock

    const slug = (slugInput || title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const existingSlug = await prisma.product.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json({ error: 'Slug sudah digunakan oleh produk lain' }, { status: 400 })
    }

    const coverFile = formData.get('cover') as File | null
    let coverUrl = ''
    if (coverFile && coverFile.size > 0) {
      const coverBlob = await put(`covers/${Date.now()}-${coverFile.name}`, coverFile, {
        access: 'public',
      })
      coverUrl = coverBlob.url
    }

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        price,
        stock: validStock,
        coverUrl,
        category,
        isActive: isActiveStr === 'false' ? false : true,
      },
    })

    const productFiles = formData.getAll('files') as File[]
    const fileRecords = []

    for (const file of productFiles) {
      if (file && file.size > 0) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return NextResponse.json(
            { error: `Tipe file ${file.name} tidak diizinkan. Hanya .txt, .pdf, .docx` },
            { status: 400 }
          )
        }

        const fileBlob = await put(`files/${product.id}/${file.name}`, file, {
          access: 'public',
        })

        const fileRecord = await prisma.productFile.create({
          data: {
            productId: product.id,
            fileName: file.name,
            blobUrl: fileBlob.url,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
        })
        fileRecords.push(fileRecord)
      }
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    await prisma.auditLog.create({
      data: {
        actor: session.user?.email || 'admin',
        action: 'CREATE_PRODUCT',
        detail: `Membuat produk "${product.title}" (${product.id}) stok ${validStock}`,
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: error.message || 'Gagal menyimpan produk' }, { status: 500 })
  }
}
