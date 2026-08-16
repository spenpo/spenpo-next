import Stripe from 'stripe'
import { InvoiceOverdue } from '@/emails/InvoiceOverdue'
import { InvoicePaid } from '@/emails/InvoicePaid'
import { InvoicePaymentFailed } from '@/emails/InvoicePaymentFailed'
import { InvoiceReady } from '@/emails/InvoiceReady'
import { InvoiceEmailProps } from '@/emails/components/InvoiceLayout'
import { FirstPaymentMethodSaved } from '@/emails/FirstPaymentMethodSaved'
import {
  formatMoney,
  invoiceCustomerId,
  listCustomerPaymentMethods,
  paymentMethodLabel,
  serializePaymentMethod,
} from '@/app/utils/billing'
import { renderEmail, resend } from '@/app/utils/resend'
import { stripeBilling } from '@/app/utils/stripe'

const SITE_URL = 'https://spenpo.com'
/** Override with BILLING_FROM_EMAIL. Must be a local-part on verified spenpo.com. */
const DEFAULT_FROM = 'Spenpo Billing <billing@spenpo.com>'

type InvoiceEmailKind = 'ready' | 'overdue' | 'paid' | 'failed'

const EVENT_KIND: Record<string, InvoiceEmailKind> = {
  'invoice.created': 'ready',
  'invoice.finalized': 'ready',
  'invoice.overdue': 'overdue',
  'invoice.paid': 'paid',
  'invoice.payment_failed': 'failed',
}

const IDEMPOTENCY_PREFIX: Record<InvoiceEmailKind, string> = {
  ready: 'invoice-ready',
  overdue: 'invoice-overdue',
  paid: 'invoice-paid',
  failed: 'invoice-failed',
}

function billingFromAddress() {
  return process.env.BILLING_FROM_EMAIL || DEFAULT_FROM
}

function invoicePayUrl(invoiceId: string, email?: string | null) {
  const url = new URL(`${SITE_URL}/account/billing/${invoiceId}`)
  if (email) url.searchParams.set('email', email)
  return url.toString()
}

function formatInvoiceDate(unix: number | null | undefined) {
  if (!unix) return null
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

async function resolveInvoiceRecipient(invoice: Stripe.Invoice) {
  if (invoice.customer_email) return invoice.customer_email

  const customerId = invoiceCustomerId(invoice)
  if (!customerId) return null

  try {
    const customer = await stripeBilling.customers.retrieve(customerId)
    if (customer.deleted) return null
    return customer.email ?? null
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log('billing invoice email customer lookup failed', message)
    return null
  }
}

function emailForKind(kind: InvoiceEmailKind, props: InvoiceEmailProps) {
  switch (kind) {
    case 'ready':
      return {
        subject: `Invoice ${props.invoiceNumber} from Spenpo`,
        body: <InvoiceReady {...props} />,
      }
    case 'overdue':
      return {
        subject: `Invoice ${props.invoiceNumber} is overdue`,
        body: <InvoiceOverdue {...props} />,
      }
    case 'paid':
      return {
        subject: `Payment received for invoice ${props.invoiceNumber}`,
        body: <InvoicePaid {...props} />,
      }
    case 'failed':
      return {
        subject: `Payment failed for invoice ${props.invoiceNumber}`,
        body: <InvoicePaymentFailed {...props} />,
      }
  }
}

export async function sendInvoiceEventEmail(
  eventType: string,
  invoice: Stripe.Invoice
) {
  const kind = EVENT_KIND[eventType]
  if (!kind) return

  if (kind === 'ready') {
    const heldDraft = invoice.status === 'draft' && invoice.auto_advance === false
    if (invoice.status !== 'open' && !heldDraft) return
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('billing invoice email skipped: RESEND_API_KEY is not set')
    return
  }

  const to = await resolveInvoiceRecipient(invoice)
  if (!to) {
    console.log('billing invoice email skipped: no customer email', invoice.id)
    return
  }

  const invoiceNumber = invoice.number || invoice.id
  const amountCents = kind === 'paid' ? invoice.amount_paid : invoice.amount_due
  const props: InvoiceEmailProps = {
    customerName: invoice.customer_name,
    invoiceNumber,
    amount: formatMoney(amountCents, invoice.currency),
    dueDate: formatInvoiceDate(invoice.due_date),
    invoiceUrl: invoicePayUrl(invoice.id, to),
    billedEmail: to,
    hostedInvoiceUrl:
      kind === 'paid' ? null : invoice.hosted_invoice_url ?? null,
  }

  const { subject, body } = emailForKind(kind, props)
  const { data, error } = await resend.emails.send(
    {
      from: billingFromAddress(),
      to: [to],
      subject,
      ...(await renderEmail(body)),
      tags: [
        { name: 'invoice_id', value: invoice.id },
        { name: 'event', value: kind },
      ],
    },
    { idempotencyKey: `${IDEMPOTENCY_PREFIX[kind]}/${invoice.id}` }
  )

  if (error) {
    console.log('billing invoice email failed', eventType, invoice.id, error.message)
    return
  }

  console.log('billing invoice email sent', eventType, invoice.id, data?.id)
}

function notifyAddress() {
  return process.env.BILLING_NOTIFY_EMAIL || 'spenpo@spenpo.com'
}

function stripeCustomerDashboardUrl(customerId: string, livemode: boolean) {
  const base = livemode
    ? 'https://dashboard.stripe.com'
    : 'https://dashboard.stripe.com/test'
  return `${base}/customers/${customerId}`
}

export async function sendFirstPaymentMethodEmail(method: Stripe.PaymentMethod) {
  const customerId =
    typeof method.customer === 'string' ? method.customer : method.customer?.id
  if (!customerId) return

  if (!process.env.RESEND_API_KEY) {
    console.log('billing first-method email skipped: RESEND_API_KEY is not set')
    return
  }

  const methods = await listCustomerPaymentMethods(customerId)
  if (methods.length !== 1) return

  const customer = await stripeBilling.customers.retrieve(customerId)
  if (customer.deleted) return

  const { data, error } = await resend.emails.send(
    {
      from: billingFromAddress(),
      to: [notifyAddress()],
      subject: `${customer.name || customer.email || customerId} saved a payment method`,
      ...(await renderEmail(
        <FirstPaymentMethodSaved
          customerName={customer.name ?? null}
          customerEmail={customer.email ?? null}
          methodLabel={paymentMethodLabel(serializePaymentMethod(method))}
          dashboardUrl={stripeCustomerDashboardUrl(customerId, method.livemode)}
        />
      )),
      tags: [
        { name: 'customer_id', value: customerId },
        { name: 'event', value: 'first-payment-method' },
      ],
    },
    { idempotencyKey: `billing-first-pm/${customerId}` }
  )

  if (error) {
    console.log('billing first-method email failed', customerId, error.message)
    return
  }

  console.log('billing first-method email sent', customerId, data?.id)
}
