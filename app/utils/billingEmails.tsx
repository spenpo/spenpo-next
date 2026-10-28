import Stripe from 'stripe'
import { InvoiceOverdue } from '@/emails/InvoiceOverdue'
import { InvoicePaid } from '@/emails/InvoicePaid'
import { InvoicePaymentFailed } from '@/emails/InvoicePaymentFailed'
import { InvoiceReady } from '@/emails/InvoiceReady'
import { InvoiceReminder } from '@/emails/InvoiceReminder'
import { InvoiceEmailProps } from '@/emails/components/InvoiceLayout'
import { FirstPaymentMethodSaved } from '@/emails/FirstPaymentMethodSaved'
import { CustomerPaymentMethodSaved } from '@/emails/CustomerPaymentMethodSaved'
import {
  formatMoney,
  invoiceCustomerId,
  listCustomerInvoices,
  listCustomerSubscriptions,
  paymentMethodLabel,
  serializePaymentMethod,
} from '@/app/utils/billing'
import { renderEmail, resend } from '@/app/utils/resend'
import { stripeBilling } from '@/app/utils/stripe'
import {
  INVOICE_SIGN_IN_DAYS,
  createInvoiceMagicLink,
  invoicePayUrl,
  invoiceSignInUrl,
} from '@/app/utils/billingMagicLink'

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
    const payable = Math.max(invoice.amount_due ?? 0, invoice.subtotal ?? 0)
    if (payable <= 0) return
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
  const signInUrl = invoiceSignInUrl(invoice.id, to)
  const usesMagicLink = kind === 'ready' || kind === 'overdue' || kind === 'failed'
  let invoiceUrl = invoicePayUrl(invoice.id, to)

  if (usesMagicLink) {
    const magicUrl = await createInvoiceMagicLink(to, invoice.id, {
      name: invoice.customer_name,
    })
    if (magicUrl) invoiceUrl = magicUrl
  }

  const props: InvoiceEmailProps = {
    customerName: invoice.customer_name,
    invoiceNumber,
    amount: formatMoney(amountCents, invoice.currency),
    dueDate: formatInvoiceDate(invoice.due_date),
    invoiceUrl,
    billedEmail: to,
    signInUrl: usesMagicLink ? signInUrl : null,
    linkExpiresDays: usesMagicLink ? INVOICE_SIGN_IN_DAYS : null,
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
    {
      idempotencyKey: `${IDEMPOTENCY_PREFIX[kind]}/${invoice.id}/${invoice.status ?? 'unknown'}`,
    }
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

  const customer = await stripeBilling.customers.retrieve(customerId)
  if (customer.deleted) return

  const [invoicesData, subsData] = await Promise.all([
    listCustomerInvoices(customerId),
    listCustomerSubscriptions(customerId),
  ])

  const unpaidInvoices = [...invoicesData.drafts, ...invoicesData.open]
  const unpaidCount = unpaidInvoices.length
  const unpaidTotal = unpaidInvoices.reduce(
    (sum, inv) => sum + (inv.amountDue > 0 ? inv.amountDue : inv.subtotal),
    0
  )
  const currency = unpaidInvoices[0]?.currency ?? 'usd'
  const hasSubs = subsData.current.length > 0
  const autopayStatus: 'enabled' | 'disabled' | 'none' = hasSubs
    ? subsData.current.every((s) => s.autopay)
      ? 'enabled'
      : 'disabled'
    : 'none'

  const subjectPrefix = unpaidCount > 0 ? `[Action Needed] ` : ''
  const subject = `${subjectPrefix}${customer.name || customer.email || customerId} saved a payment method`

  const { data, error } = await resend.emails.send(
    {
      from: billingFromAddress(),
      to: [notifyAddress()],
      subject,
      ...(await renderEmail(
        <FirstPaymentMethodSaved
          customerName={customer.name ?? null}
          customerEmail={customer.email ?? null}
          methodLabel={paymentMethodLabel(serializePaymentMethod(method))}
          dashboardUrl={stripeCustomerDashboardUrl(customerId, method.livemode)}
          unpaidInvoicesCount={unpaidCount}
          unpaidInvoicesAmount={
            unpaidCount > 0 ? formatMoney(unpaidTotal, currency) : null
          }
          autopayStatus={autopayStatus}
        />
      )),
      tags: [
        { name: 'customer_id', value: customerId },
        { name: 'event', value: 'first-payment-method' },
      ],
    },
    { idempotencyKey: `billing-first-pm/${customerId}/${method.id}` }
  )

  if (error) {
    console.log('billing first-method email failed', customerId, error.message)
    return
  }

  console.log('billing first-method email sent', customerId, data?.id)
}

export async function sendCustomerPaymentMethodSavedEmail(
  method: Stripe.PaymentMethod
) {
  const customerId =
    typeof method.customer === 'string' ? method.customer : method.customer?.id
  if (!customerId) return

  if (!process.env.RESEND_API_KEY) {
    console.log(
      'customer payment-method email skipped: RESEND_API_KEY is not set'
    )
    return
  }

  const customer = await stripeBilling.customers.retrieve(customerId)
  if (customer.deleted || !customer.email) return

  const to = customer.email
  const [invoicesData, subsData] = await Promise.all([
    listCustomerInvoices(customerId),
    listCustomerSubscriptions(customerId),
  ])

  const unpaidInvoices = [...invoicesData.drafts, ...invoicesData.open]
  const unpaidCount = unpaidInvoices.length
  const unpaidTotal = unpaidInvoices.reduce(
    (sum, inv) => sum + (inv.amountDue > 0 ? inv.amountDue : inv.subtotal),
    0
  )
  const currency = unpaidInvoices[0]?.currency ?? 'usd'
  const hasActiveSubscription = subsData.current.length > 0
  const autopayEnabled =
    hasActiveSubscription && subsData.current.every((s) => s.autopay)

  let actionUrl = invoicePayUrl('invoices', to)
  const magicUrl = await createInvoiceMagicLink(to, 'account/billing', {
    name: customer.name,
  })
  if (magicUrl) actionUrl = magicUrl

  const methodLabel = paymentMethodLabel(serializePaymentMethod(method))
  const subject =
    unpaidCount > 0
      ? `Your payment method was saved · Open invoice awaiting payment`
      : `Your payment method was saved on Spenpo`

  const { data, error } = await resend.emails.send(
    {
      from: billingFromAddress(),
      to: [to],
      subject,
      ...(await renderEmail(
        <CustomerPaymentMethodSaved
          customerName={customer.name ?? null}
          methodLabel={methodLabel}
          unpaidInvoicesCount={unpaidCount}
          unpaidAmount={
            unpaidCount > 0 ? formatMoney(unpaidTotal, currency) : null
          }
          actionUrl={actionUrl}
          autopayEnabled={autopayEnabled}
          hasActiveSubscription={hasActiveSubscription}
        />
      )),
      tags: [
        { name: 'customer_id', value: customerId },
        { name: 'event', value: 'customer-payment-method-saved' },
      ],
    },
    { idempotencyKey: `billing-cust-pm/${customerId}/${method.id}` }
  )

  if (error) {
    console.log(
      'billing customer payment method email failed',
      customerId,
      error.message
    )
    return
  }

  console.log('billing customer payment method email sent', customerId, data?.id)
}

export async function sendInvoiceReminderEmail(invoice: Stripe.Invoice) {
  if (!process.env.RESEND_API_KEY) {
    console.log('invoice reminder email skipped: RESEND_API_KEY is not set')
    return
  }

  const to = await resolveInvoiceRecipient(invoice)
  if (!to) {
    console.log('invoice reminder email skipped: no customer email', invoice.id)
    return
  }

  const invoiceNumber = invoice.number || invoice.id
  const amountCents = invoice.amount_due
  const signInUrl = invoiceSignInUrl(invoice.id, to)
  let invoiceUrl = invoicePayUrl(invoice.id, to)

  const magicUrl = await createInvoiceMagicLink(to, invoice.id, {
    name: invoice.customer_name,
  })
  if (magicUrl) invoiceUrl = magicUrl

  const props: InvoiceEmailProps = {
    customerName: invoice.customer_name,
    invoiceNumber,
    amount: formatMoney(amountCents, invoice.currency),
    dueDate: formatInvoiceDate(invoice.due_date),
    invoiceUrl,
    billedEmail: to,
    signInUrl,
    linkExpiresDays: INVOICE_SIGN_IN_DAYS,
  }

  const { data, error } = await resend.emails.send(
    {
      from: billingFromAddress(),
      to: [to],
      subject: `Friendly reminder: Invoice ${invoiceNumber} from Spenpo is awaiting payment`,
      ...(await renderEmail(<InvoiceReminder {...props} />)),
      tags: [
        { name: 'invoice_id', value: invoice.id },
        { name: 'event', value: 'reminder' },
      ],
    },
    {
      idempotencyKey: `invoice-reminder/${invoice.id}/${new Date().toISOString().slice(0, 10)}`,
    }
  )

  if (error) {
    console.log('billing invoice reminder email failed', invoice.id, error.message)
    return
  }

  console.log('billing invoice reminder email sent', invoice.id, data?.id)
}
