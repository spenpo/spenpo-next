import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { authOptions } from '@/app/constants/api'
import prisma from '@/app/utils/prisma'
import { stripeBilling } from '@/app/utils/stripe'
import { getOrCreateStripeCustomer } from '@/app/utils/stripeCustomer'

export const CARD_SURCHARGE_RATE = 0.03

export type SerializedInvoiceLine = {
  id: string
  description: string | null
  amount: number
  quantity: number | null
}

export type SerializedInvoice = {
  id: string
  number: string | null
  status: Stripe.Invoice.Status | null
  created: number
  dueDate: number | null
  currency: string
  amountDue: number
  amountPaid: number
  amountRemaining: number
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  description: string | null
  lines: SerializedInvoiceLine[]
}

export type SerializedPaymentMethod = {
  id: string
  type: string
  brand: string | null
  last4: string | null
  expMonth: number | null
  expYear: number | null
  bankName: string | null
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export function calculateInvoiceSurcharge(params: {
  amountDue: number
  paymentMethodType?: string | null
  cardFunding?: string | null
}) {
  const applies =
    params.paymentMethodType === 'card' && params.cardFunding === 'credit'
  const surcharge = applies ? Math.round(params.amountDue * CARD_SURCHARGE_RATE) : 0
  return {
    applies,
    surcharge,
    total: params.amountDue + surcharge,
  }
}

export function estimateInvoiceSurcharge(
  amountDue: number,
  paymentMethodType?: string | null
) {
  const estimated = paymentMethodType === 'card'
  const surcharge = estimated ? Math.round(amountDue * CARD_SURCHARGE_RATE) : 0
  return { estimated, surcharge, total: amountDue + surcharge }
}

export function invoiceCustomerId(invoice: Stripe.Invoice): string | null {
  const customer = invoice.customer
  if (!customer) return null
  return typeof customer === 'string' ? customer : customer.id
}

export function serializeInvoice(invoice: Stripe.Invoice): SerializedInvoice {
  const lines = (invoice.lines?.data ?? []).map((line) => ({
    id: line.id,
    description: line.description,
    amount: line.amount,
    quantity: line.quantity ?? null,
  }))

  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    created: invoice.created,
    dueDate: invoice.due_date,
    currency: invoice.currency,
    amountDue: invoice.amount_due,
    amountPaid: invoice.amount_paid,
    amountRemaining: invoice.amount_remaining,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
    description: invoice.description,
    lines,
  }
}

export function serializePaymentMethod(
  method: Stripe.PaymentMethod
): SerializedPaymentMethod {
  return {
    id: method.id,
    type: method.type,
    brand: method.card?.brand ?? null,
    last4: method.card?.last4 ?? method.us_bank_account?.last4 ?? null,
    expMonth: method.card?.exp_month ?? null,
    expYear: method.card?.exp_year ?? null,
    bankName: method.us_bank_account?.bank_name ?? null,
  }
}

export async function requireBillingContext() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.email) {
    return {
      error: NextResponse.json(
        { error: 'An email address is required for billing' },
        { status: 400 }
      ),
    }
  }

  const customerId = await getOrCreateStripeCustomer(user)
  return { user, customerId, session }
}

export async function listCustomerInvoices(customerId: string) {
  const invoices: Stripe.Invoice[] = []
  for await (const invoice of stripeBilling.invoices.list({
    customer: customerId,
    limit: 100,
  })) {
    if (invoice.status && invoice.status !== 'draft') {
      invoices.push(invoice)
    }
  }

  const open = invoices.filter((invoice) => invoice.status === 'open')
  const history = invoices.filter((invoice) => invoice.status !== 'open')

  return {
    open: open.map(serializeInvoice),
    history: history.map(serializeInvoice),
  }
}

export async function getOwnedInvoice(customerId: string, invoiceId: string) {
  const invoice = await stripeBilling.invoices.retrieve(invoiceId)
  if (invoiceCustomerId(invoice) !== customerId) {
    return null
  }
  return invoice
}

export async function markInvoicePaidFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
) {
  const invoiceId = paymentIntent.metadata?.stripeInvoiceId
  if (!invoiceId) return

  const invoice = await stripeBilling.invoices.retrieve(invoiceId)
  if (invoice.status === 'paid' || invoice.status === 'void') return

  await stripeBilling.invoices.update(invoiceId, {
    metadata: {
      ...invoice.metadata,
      billingPaymentIntentId: paymentIntent.id,
    },
  })

  if (invoice.status === 'open') {
    try {
      await stripeBilling.invoices.pay(invoiceId, {
        paid_out_of_band: true,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (!/already paid|not open/i.test(message)) {
        throw err
      }
    }
  }
}
