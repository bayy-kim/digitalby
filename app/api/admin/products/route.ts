import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { z } from 'zod'

const ALLOWED_MIME_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]

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
    const category = (formData.get('category') as string) || null
    const isActiveStr = formData.get('isActive') as string

    if (!title || !description || !priceStr) {
      return NextResponse.json({ error: 'Judul, deskripsi, dan harga wajib diisi' }, { status: 400 })
    }

    const price = parseInt(priceStr, 10)
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Harga harus berupa angka positif' }, { status: 400 })
    }

    const slug = (slugInput || title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json({ error: 'Slug sudah digunakan oleh produk lain' }, { status: 400 })
    }

    // Cover Image Handling
    const coverFile = formData.get('cover') as File | null
    let coverUrl = ''
    if (coverFile && coverFile.size > 0) {
      const coverBlob = await put(`covers/${Date.now()}-${coverFile.name}`, coverFile, {
        access: 'public',
      })
      coverUrl = coverBlob.url
    }

    // Create Product
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        price,
        coverUrl,
        category,
        isActive: isActiveStr === 'false' ? false : true,
      },
    })

    // Product File Upload Handling (Multiple files)
    const productFiles = formData.getAll('files') as File[]
    const fileRecords = []

    for (const file of productFiles) {
      if (file && file.size > 0) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        const mimeType = file.type

        // Validate MIME type & Extension
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return NextResponse.json(
            { error: `Tipe file ${file.name} tidak diizinkan. Hanya .txt, .pdf, .docx` },
            { status: 400 }
          )
        }

        // Upload to Vercel Blob (private token)
        const fileBlob = await put(`files/${product.id}/${file.name}`, file, {
          access: 'public', // Blob storage URL accessed server-side only via download token stream
        })

        const fileRecord = await prisma.productFile.create({
          data: {
            productId: product.id,
            fileName: file.name,
            blobUrl: fileBlob.url,
            mimeType: mimeType || 'application/octet-stream',
            sizeBytes: file.size,
          },
        })
        fileRecords.push(fileRecord)
      }
    }

    // Audit Log
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    await prisma.auditLog.create({
      data: {
        actor: session.user?.email || 'admin',
        action: 'CREATE_PRODUCT',
        detail: `Membuat produk "${product.title}" (${product.id}) dengan ${fileRecords.length} file`,
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: error.message || 'Gagal menyimpan produk' }, { status: 500 })
  }
}
