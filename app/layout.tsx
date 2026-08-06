import type { Metadata, Viewport } from 'next'
import { Bangers, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const fontComic = Bangers({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-comic-heading',
  display: 'swap',
})

const fontBody = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Bayu Digital Store - Toko Produk Digital Serba Otomatis',
  description: 'Download produk digital berkualitas (template, ebook, dokumen) otomatis setelah pembayaran QRIS terverifikasi.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${fontComic.variable} ${fontBody.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#121212] antialiased">
        {children}
      </body>
    </html>
  )
}
