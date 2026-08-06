import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { OrderStatusClient } from './OrderStatusClient'

export const revalidate = 0

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: {
        include: {
          files: true,
        },
      },
      downloadTokens: {
        where: {
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!order) {
    notFound()
  }

  const activeToken = order.downloadTokens[0]?.token || null

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header />

      <main className="flex-1 py-8 px-4 max-w-xl mx-auto w-full">
        <OrderStatusClient
          order={{
            id: order.id,
            amount: order.amount,
            status: order.status,
            createdAt: order.createdAt.toISOString(),
            product: {
              id: order.product.id,
              title: order.product.title,
              description: order.product.description,
              filesCount: order.product.files.length,
            },
          }}
          initialToken={activeToken}
        />
      </main>

      <Footer />
    </div>
  )
}
