import prisma from '@/app/utils/prisma'
import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../constants/api'
import { stripeProduct } from '@/app/utils/stripe'

export async function POST(req: NextRequest) {
  const { metadata, productId } = await req.json()
  const session = await getServerSession(authOptions)

  const product = await prisma.product.findUnique({ where: { id: productId } })

  const order = await prisma.order.create({
    data: {
      user: {
        connect: { id: session?.user.id },
      },
      metadata,
      product: {
        connect: {
          id: productId,
        },
      },
      environment: process.env.NODE_ENV,
    },
  })

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripeProduct.paymentIntents.create({
    amount: product!.price + Number(metadata.price),
    currency: 'usd',
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: { orderId: order.id },
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    id: order.id,
  })
}
