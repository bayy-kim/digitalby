import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { LicenseType } from '@prisma/client'

const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.docx', '.doc']

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()

    const priceStr = formData.get('price') as string
    const category = (formData.get('category') as string) || null
    const licenseTypeInput = (formData.get('licenseType') as string) || 'MULTI_USER'
    const licenseType: LicenseType = licenseTypeInput === 'EXCLUSIVE_SINGLE' ? 'EXCLUSIVE_SINGLE' : 'MULTI_USER'
    const stockStr = (formData.get('stock') as string) || (licenseType === 'EXCLUSIVE_SINGLE' ? '1' : '100')

    const price = parseInt(priceStr, 10)
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Harga harus berupa angka positif' }, { status: 400 })
    }

    let stock = parseInt(stockStr, 10)
    if (licenseType === 'EXCLUSIVE_SINGLE') {
      stock = 1
    }

    // Cover File Upload (1 Shared Cover)
    const coverFile = formData.get('cover') as File | null
    let coverUrl = ''
    if (coverFile && coverFile.size > 0) {
      const coverBlob = await put(`covers/${Date.now()}-${coverFile.name}`, coverFile, {
        access: 'private',
      })
      coverUrl = coverBlob.url
    }

    // Multiple Files Upload (Each file becomes a standalone product)
    const productFiles = formData.getAll('files') as File[]
    if (!productFiles || productFiles.length === 0) {
      return NextResponse.json({ error: 'Minimal 1 file produk harus diunggah' }, { status: 400 })
    }

    const createdProducts = []

    for (const file of productFiles) {
      if (file && file.size > 0) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          continue
        }

        // Generate clean title & slug from filename
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
        const title = baseName.replace(/[-_]/g, ' ')
        
        let rawSlug = baseName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')

        let slug = rawSlug
        let counter = 1
        while (await prisma.product.findUnique({ where: { slug } })) {
          slug = `${rawSlug}-${counter}`
          counter++
        }

        // Create product
        const product = await prisma.product.create({
          data: {
            title,
            slug,
            description: `Produk digital ${title} siap unduh setelah pembayaran.`,
            price,
            stock,
            licenseType,
            coverUrl,
            category,
            isActive: true,
          },
        })

        // Upload file to Vercel Blob private
        const fileBlob = await put(`files/${product.id}/${file.name}`, file, {
          access: 'private',
        })

        await prisma.productFile.create({
          data: {
            productId: product.id,
            fileName: file.name,
            blobUrl: fileBlob.url,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
        })

        createdProducts.push(product)
      }
    }

    // Record AuditLog
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    await prisma.auditLog.create({
      data: {
        actor: session.user?.email || 'admin',
        action: 'BATCH_CREATE_PRODUCTS',
        detail: `Membuat batch ${createdProducts.length} produk dengan 1 cover bersama`,
        ipAddress: ip,
      },
    })

    return NextResponse.json({
      success: true,
      createdCount: createdProducts.length,
      products: createdProducts,
    })
  } catch (error: any) {
    console.error('Error batch creating products:', error)
    return NextResponse.json({ error: error.message || 'Gagal membuat batch produk' }, { status: 500 })
  }
}
