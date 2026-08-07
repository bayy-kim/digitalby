import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { CatalogSearch } from '@/components/CatalogSearch'
import { Testimonials } from '@/components/Testimonials'
import { prisma } from '@/lib/prisma'

export const revalidate = 0 // Dynamic catalog

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      files: {
        select: { mimeType: true, fileName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formattedProducts = JSON.parse(JSON.stringify(products))

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION - Comic Modern Style with Animations */}
        <HeroSection />

        {/* CATALOG SECTION WITH SEARCH & CATEGORY FILTERS */}
        <section id="katalog" className="py-12 px-4 max-w-6xl mx-auto space-y-6">
          <div className="border-b-3 border-[#121212] pb-4">
            <h2 className="font-comic text-3xl sm:text-4xl text-[#121212] tracking-wide uppercase">
              KATALOG PRODUK DIGITAL
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-body font-medium">
              Pilih produk yang Anda butuhkan dan unduh secara instan
            </p>
          </div>

          <CatalogSearch products={formattedProducts} />
        </section>

        {/* COMIC TESTIMONIALS SECTION */}
        <Testimonials />
      </main>

      <Footer />
    </div>
  )
}
