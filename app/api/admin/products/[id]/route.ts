import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.docx', '.doc']

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const formData = await request.formData()

    const title = formData.get('title') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const priceStr = formData.get('price') as string
    const category = (formData.get('category') as string) || null
    const isActiveStr = formData.get('isActive') as string

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    const price = parseInt(priceStr, 10)

    // Handle optional cover replacement
    const coverFile = formData.get('cover') as File | null
    let coverUrl = existingProduct.coverUrl
    if (coverFile && coverFile.size > 0) {
      const coverBlob = await put(`covers/${Date.now()}-${coverFile.name}`, coverFile, {
        access: 'public',
      })
      coverUrl = coverBlob.url
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        price,
        category,
        coverUrl,
        isActive: isActiveStr === 'false' ? false : true,
      },
    })

    // Handle new file additions
    const newFiles = formData.getAll('files') as File[]
    for (const file of newFiles) {
      if (file && file.size > 0) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          continue
        }

        const fileBlob = await put(`files/${id}/${file.name}`, file, {
          access: 'public',
        })

        await prisma.productFile.create({
          data: {
            productId: id,
            fileName: file.name,
            blobUrl: fileBlob.url,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
        })
      }
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    await prisma.auditLog.create({
      data: {
        actor: session.user?.email || 'admin',
        action: 'UPDATE_PRODUCT',
        detail: `Mengubah produk "${updated.title}" (${id})`,
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true, product: updated })
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const deleted = await prisma.product.delete({
      where: { id },
    })

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    await prisma.auditLog.create({
      data: {
        actor: session.user?.email || 'admin',
        action: 'DELETE_PRODUCT',
        detail: `Menghapus produk "${deleted.title}" (${id})`,
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 })
  }
}
