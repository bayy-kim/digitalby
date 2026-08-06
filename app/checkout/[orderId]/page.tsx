import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CheckoutClient } from './CheckoutClient'

export const revalidate = 0

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: true,
    },
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header />

      <main className="flex-1 py-8 px-4 max-w-xl mx-auto w-full">
        <CheckoutClient order={{
          id: order.id,
          amount: order.amount,
          status: order.status,
          qrisUrl: order.qrisUrl,
          expiredAt: order.expiredAt.toISOString(),
          productTitle: order.product.title,
          customerName: order.customerName,
        }} />
      </main>

      <Footer />
    </div>
  )
}
