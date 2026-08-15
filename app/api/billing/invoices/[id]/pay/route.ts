import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  calculateInvoiceSurcharge,
  getOwnedInvoice,
  requireBillingContext,
} from '@/app/utils/billing'
import { stripeBilling } from '@/app/utils/stripe'

type PayBody = {
  confirmationTokenId?: string
  returnUrl?: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const body = (await req.json()) as PayBody
  if (!body.confirmationTokenId) {
    return NextResponse.json(
      { error: 'confirmationTokenId is required' },
      { status: 400 }
    )
  }

  const invoice = await getOwnedInvoice(context.customerId, params.id)
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }
  if (invoice.status !== 'open' || invoice.amount_due <= 0) {
    return NextResponse.json(
      { error: 'This invoice cannot be paid' },
      { status: 409 }
    )
  }

  const token = await stripeBilling.confirmationTokens.retrieve(
    body.confirmationTokenId
  )
  const preview = token.payment_method_preview
  const { surcharge, total, applies } = calculateInvoiceSurcharge({
    amountDue: invoice.amount_due,
    paymentMethodType: preview?.type,
    cardFunding: preview?.card?.funding,
  })

  const returnUrl =
    body.returnUrl ||
    `${req.nextUrl.origin}/account/billing/${invoice.id}?payment=complete`

  const createParams: Stripe.PaymentIntentCreateParams = {
    amount: total,
    currency: invoice.currency,
    customer: context.customerId,
    confirm: true,
    confirmation_token: body.confirmationTokenId,
    use_stripe_sdk: true,
    return_url: returnUrl,
    description: invoice.number
      ? `Invoice ${invoice.number}`
      : `Invoice ${invoice.id}`,
    metadata: {
      stripeInvoiceId: invoice.id,
      userId: context.user.id,
    },
  }

  if (applies && surcharge > 0) {
    Object.assign(createParams, {
      amount_details: {
        surcharge: { amount: surcharge },
      },
    })
  }

  let paymentIntent: Stripe.PaymentIntent
  try {
    paymentIntent = await stripeBilling.paymentIntents.create(createParams, {
      idempotencyKey: `billing-pay-${invoice.id}-${body.confirmationTokenId}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create payment'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({
    status: paymentIntent.status,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amountDue: invoice.amount_due,
    surcharge,
    total,
    currency: invoice.currency,
  })
}
