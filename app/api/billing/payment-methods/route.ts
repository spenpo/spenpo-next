import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  listCustomerPaymentMethods,
  ownedPaymentMethod,
  preferredDefaultPaymentMethod,
  reconcileCustomerBankDiscount,
  serializePaymentMethod,
  setCustomerDefaultPaymentMethod,
} from '@/app/utils/billing'
import { requireBillingContext } from '@/app/utils/billingSession'
import { stripeBilling } from '@/app/utils/stripe'

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

  let method: Stripe.PaymentMethod
  try {
    method = await stripeBilling.paymentMethods.retrieve(paymentMethodId)
  } catch (err) {
    const code = err instanceof Stripe.errors.StripeError ? err.code : null
    if (code === 'resource_missing') {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }
    throw err
  }

  const methodCustomer =
    typeof method.customer === 'string' ? method.customer : method.customer?.id
  if (!methodCustomer) {
    method = await stripeBilling.paymentMethods.attach(paymentMethodId, {
      customer: context.customerId,
    })
  } else if (methodCustomer !== context.customerId) {
    return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
  }

  await setCustomerDefaultPaymentMethod(context.customerId, method)
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

  const method = await ownedPaymentMethod(context.customerId, paymentMethodId)
  if (!method) {
    return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
  }

  const customer = await stripeBilling.customers.retrieve(context.customerId)
  if (customer.deleted) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const defaultPaymentMethod = customer.invoice_settings.default_payment_method
  const defaultPaymentMethodId =
    typeof defaultPaymentMethod === 'string'
      ? defaultPaymentMethod
      : defaultPaymentMethod?.id ?? null

  await stripeBilling.paymentMethods.detach(paymentMethodId)

  const remaining = await listCustomerPaymentMethods(context.customerId)
  if (defaultPaymentMethodId === paymentMethodId || !defaultPaymentMethodId) {
    await setCustomerDefaultPaymentMethod(
      context.customerId,
      preferredDefaultPaymentMethod(remaining)
    )
  } else {
    const stillDefault =
      remaining.find((item) => item.id === defaultPaymentMethodId) ?? null
    await reconcileCustomerBankDiscount(
      context.customerId,
      stillDefault?.type ?? null
    )
  }

  return NextResponse.json({ ok: true })
}
