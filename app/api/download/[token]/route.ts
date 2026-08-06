import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as archiver from 'archiver'
import { Readable } from 'stream'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const downloadToken = await prisma.downloadToken.findUnique({
      where: { token },
      include: {
        order: {
          include: {
            product: {
              include: {
                files: true,
              },
            },
          },
        },
      },
    })

    if (!downloadToken) {
      return NextResponse.json({ error: 'Token unduhan tidak valid' }, { status: 404 })
    }

    if (new Date() > new Date(downloadToken.expiresAt)) {
      return NextResponse.json({ error: 'Token unduhan telah kedaluwarsa (berlaku 24 jam)' }, { status: 410 })
    }

    if (downloadToken.usedCount >= downloadToken.maxUses) {
      return NextResponse.json({ error: 'Batas maksimum unduhan telah tercapai' }, { status: 429 })
    }

    const { order } = downloadToken
    if (!order || order.status !== 'PAID') {
      return NextResponse.json({ error: 'Pesanan belum dikonfirmasi lunas' }, { status: 403 })
    }

    const { product } = order
    if (!product || !product.files || product.files.length === 0) {
      return NextResponse.json({ error: 'File produk tidak ditemukan pada server' }, { status: 404 })
    }

    // Increment download count
    await prisma.downloadToken.update({
      where: { id: downloadToken.id },
      data: {
        usedCount: { increment: 1 },
      },
    })

    // If product has 1 file, stream that single file directly
    if (product.files.length === 1) {
      const file = product.files[0]
      const fileResponse = await fetch(file.blobUrl, {
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
      })

      if (!fileResponse.ok) {
        // Fallback fetch without authorization if blob is directly accessible or token not required
        const fallbackRes = await fetch(file.blobUrl)
        if (!fallbackRes.ok) {
          return NextResponse.json({ error: 'Gagal mengambil file dari penyimpanan' }, { status: 500 })
        }
        const fileData = await fallbackRes.arrayBuffer()
        return new NextResponse(fileData, {
          headers: {
            'Content-Type': file.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${file.fileName}"`,
          },
        })
      }

      const fileData = await fileResponse.arrayBuffer()
      return new NextResponse(fileData, {
        headers: {
          'Content-Type': file.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${file.fileName}"`,
        },
      })
    }

    // If product has multiple files, zip them on-the-fly using archiver
    const archive = (archiver as any)('zip', { zlib: { level: 9 } })
    const nodeStream = new Readable({ read() {} })

    archive.on('data', (chunk: any) => nodeStream.push(chunk))
    archive.on('end', () => nodeStream.push(null))
    archive.on('error', (err: any) => nodeStream.destroy(err))

    // Download each file from Blob and append to ZIP archive
    for (const file of product.files) {
      try {
        const fileRes = await fetch(file.blobUrl, {
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        })
        if (fileRes.ok) {
          const buffer = Buffer.from(await fileRes.arrayBuffer())
          archive.append(buffer, { name: file.fileName })
        } else {
          // Fallback fetch
          const fbRes = await fetch(file.blobUrl)
          if (fbRes.ok) {
            const buffer = Buffer.from(await fbRes.arrayBuffer())
            archive.append(buffer, { name: file.fileName })
          }
        }
      } catch (err) {
        console.error(`Failed to pack file ${file.fileName}:`, err)
      }
    }

    archive.finalize()

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk))
        nodeStream.on('end', () => controller.close())
        nodeStream.on('error', (err) => controller.error(err))
      },
    })

    const zipFileName = `${product.slug}-files.zip`

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengunduh file' },
      { status: 500 }
    )
  }
}
