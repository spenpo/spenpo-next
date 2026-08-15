import { NextRequest, NextResponse } from 'next/server'
import { requireBillingContext, serializePaymentMethod } from '@/app/utils/billing'
import { stripeBilling } from '@/app/utils/stripe'

async function listCustomerPaymentMethods(customerId: string) {
  const [cards, banks] = await Promise.all([
    stripeBilling.paymentMethods.list({ customer: customerId, type: 'card' }),
    stripeBilling.paymentMethods.list({
      customer: customerId,
      type: 'us_bank_account',
    }),
  ])
  return [...cards.data, ...banks.data]
}

export async function GET() {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const customer = await stripeBilling.customers.retrieve(context.customerId)
  if (customer.deleted) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const defaultPaymentMethod = customer.invoice_settings.default_payment_method
  const defaultPaymentMethodId =
    typeof defaultPaymentMethod === 'string'
      ? defaultPaymentMethod
      : defaultPaymentMethod?.id ?? null

  const methods = await listCustomerPaymentMethods(context.customerId)

  return NextResponse.json({
    methods: methods.map(serializePaymentMethod),
    defaultPaymentMethodId,
  })
}

export async function POST(req: NextRequest) {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const { paymentMethodId } = (await req.json()) as { paymentMethodId?: string }
  if (!paymentMethodId) {
    return NextResponse.json(
      { error: 'paymentMethodId is required' },
      { status: 400 }
    )
  }

  const method = await stripeBilling.paymentMethods.retrieve(paymentMethodId)
  if (method.customer !== context.customerId) {
    return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
  }

  await stripeBilling.customers.update(context.customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const paymentMethodId = req.nextUrl.searchParams.get('id')
  if (!paymentMethodId) {
    return NextResponse.json(
      { error: 'Payment method id is required' },
      { status: 400 }
    )
  }

  const method = await stripeBilling.paymentMethods.retrieve(paymentMethodId)
  if (method.customer !== context.customerId) {
    return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
  }

  await stripeBilling.paymentMethods.detach(paymentMethodId)
  return NextResponse.json({ ok: true })
}
