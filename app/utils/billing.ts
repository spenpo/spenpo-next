import Stripe from 'stripe'
import { stripeBilling } from '@/app/utils/stripe'

export const BANK_DISCOUNT_RATE = 0.02
const BANK_DISCOUNT_COUPON_METADATA = 'bank_discount'
const BANK_DISCOUNT_COUPON_IDEMPOTENCY = 'billing-bank-discount-coupon'

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
  subtotal: number
  discountAmount: number
  amountDue: number
  amountPaid: number
  amountRemaining: number
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  description: string | null
  lines: SerializedInvoiceLine[]
  subscriptionId: string | null
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

export function bankDiscountCents(listAmount: number) {
  return Math.round(listAmount * BANK_DISCOUNT_RATE)
}

export function bankAmount(listAmount: number) {
  return listAmount - bankDiscountCents(listAmount)
}

export function periodsPerYear(
  interval: string | null,
  intervalCount: number | null
) {
  const count = intervalCount ?? 1
  if (!interval || count <= 0) return 0
  if (interval === 'year') return 1 / count
  if (interval === 'month') return 12 / count
  if (interval === 'week') return 52 / count
  if (interval === 'day') return 365 / count
  return 0
}

export function annualAmount(
  listAmount: number,
  interval: string | null,
  intervalCount: number | null
) {
  return Math.round(listAmount * periodsPerYear(interval, intervalCount))
}

function invoiceDiscountAmount(invoice: Stripe.Invoice) {
  return (invoice.total_discount_amounts ?? []).reduce(
    (sum, item) => sum + item.amount,
    0
  )
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
    subtotal: invoice.subtotal,
    discountAmount: invoiceDiscountAmount(invoice),
    amountDue: invoice.amount_due,
    amountPaid: invoice.amount_paid,
    amountRemaining: invoice.amount_remaining,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
    description: invoice.description,
    lines,
    subscriptionId: invoiceSubscriptionId(invoice),
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

export function preferredDefaultPaymentMethod<T extends { type: string }>(
  methods: T[]
) {
  return (
    methods.find((method) => method.type === 'us_bank_account') ??
    methods[0] ??
    null
  )
}

export function paymentMethodLabel(method: SerializedPaymentMethod) {
  if (method.type === 'card') {
    const brand = method.brand ? method.brand.toUpperCase() : 'Card'
    const exp =
      method.expMonth && method.expYear
        ? ` · ${method.expMonth}/${method.expYear}`
        : ''
    return `${brand} •••• ${method.last4 ?? ''}${exp}`
  }
  if (method.type === 'us_bank_account') {
    return `${method.bankName ?? 'Bank'} •••• ${method.last4 ?? ''}`
  }
  return method.type
}

export type SerializedSubscriptionItem = {
  id: string
  productName: string
  amount: number
  currency: string
  interval: string | null
  intervalCount: number | null
  quantity: number | null
}

export type SerializedSubscription = {
  id: string
  status: Stripe.Subscription.Status
  collectionMethod: Stripe.Subscription.CollectionMethod
  autopay: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodStart: number | null
  currentPeriodEnd: number | null
  currency: string
  description: string | null
  defaultPaymentMethodId: string | null
  daysUntilDue: number | null
  items: SerializedSubscriptionItem[]
  latestInvoiceId: string | null
  openInvoiceId: string | null
  openInvoiceAmountDue: number | null
}

export function subscriptionListAmount(subscription: SerializedSubscription) {
  return subscription.items.reduce(
    (sum, item) => sum + item.amount * (item.quantity ?? 1),
    0
  )
}

export function subscriptionAnnualListAmount(subscription: SerializedSubscription) {
  return subscription.items.reduce((sum, item) => {
    const amount = item.amount * (item.quantity ?? 1)
    return sum + annualAmount(amount, item.interval, item.intervalCount)
  }, 0)
}

const SUBSCRIPTION_EXPAND = [
  'items.data.price.product',
  'default_payment_method',
  'latest_invoice',
] as const

const SUBSCRIPTION_LIST_EXPAND = [
  'data.items.data.price',
  'data.default_payment_method',
] as const

export function subscriptionCustomerId(subscription: Stripe.Subscription): string {
  const customer = subscription.customer
  return typeof customer === 'string' ? customer : customer.id
}

export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription
  if (!subscription) return null
  return typeof subscription === 'string' ? subscription : subscription.id
}

function idFromExpandable(
  value: string | { id: string } | null | undefined
): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

function productNameFromPrice(price: Stripe.Price): string {
  const product = price.product
  if (typeof product === 'object' && product && !product.deleted) {
    return product.name
  }
  return price.nickname || 'Subscription'
}

export function serializeSubscription(
  subscription: Stripe.Subscription,
  openInvoice?: Stripe.Invoice | null
): SerializedSubscription {
  const items = subscription.items.data.map((item) => ({
    id: item.id,
    productName: productNameFromPrice(item.price),
    amount: item.price.unit_amount ?? 0,
    currency: item.price.currency,
    interval: item.price.recurring?.interval ?? null,
    intervalCount: item.price.recurring?.interval_count ?? null,
    quantity: item.quantity ?? null,
  }))

  const periodStarts = subscription.items.data.map(
    (item) => item.current_period_start
  )
  const periodEnds = subscription.items.data.map((item) => item.current_period_end)

  return {
    id: subscription.id,
    status: subscription.status,
    collectionMethod: subscription.collection_method,
    autopay: subscription.collection_method === 'charge_automatically',
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodStart: periodStarts.length ? Math.min(...periodStarts) : null,
    currentPeriodEnd: periodEnds.length ? Math.max(...periodEnds) : null,
    currency: subscription.currency,
    description: subscription.description,
    defaultPaymentMethodId: idFromExpandable(subscription.default_payment_method),
    daysUntilDue: subscription.days_until_due,
    items,
    latestInvoiceId: idFromExpandable(subscription.latest_invoice),
    openInvoiceId: openInvoice?.id ?? null,
    openInvoiceAmountDue: openInvoice?.amount_due ?? null,
  }
}

export async function listCustomerPaymentMethods(customerId: string) {
  const [cards, banks] = await Promise.all([
    stripeBilling.paymentMethods.list({ customer: customerId, type: 'card' }),
    stripeBilling.paymentMethods.list({
      customer: customerId,
      type: 'us_bank_account',
    }),
  ])
  return [...cards.data, ...banks.data]
}

export async function listCustomerInvoices(customerId: string) {
  const invoices: Stripe.Invoice[] = []
  for await (const invoice of stripeBilling.invoices.list({
    customer: customerId,
    limit: 100,
  })) {
    if (invoice.status) invoices.push(invoice)
  }

  const drafts = invoices.filter((invoice) => invoice.status === 'draft')
  const open = invoices.filter((invoice) => invoice.status === 'open')
  const history = invoices.filter(
    (invoice) => invoice.status !== 'draft' && invoice.status !== 'open'
  )

  return {
    drafts: drafts.map(serializeInvoice),
    open: open.map(serializeInvoice),
    history: history.map(serializeInvoice),
  }
}

export async function getOwnedInvoice(customerId: string, invoiceId: string) {
  try {
    const invoice = await stripeBilling.invoices.retrieve(invoiceId)
    if (invoiceCustomerId(invoice) !== customerId) {
      return null
    }
    return invoice
  } catch (err) {
    const code = err instanceof Stripe.errors.StripeError ? err.code : null
    if (code === 'resource_missing') return null
    throw err
  }
}

export async function getBankDiscountCouponId() {
  const fromEnv = process.env.STRIPE_BANK_DISCOUNT_COUPON_ID
  if (fromEnv) return fromEnv

  const existing = await stripeBilling.coupons.list({ limit: 100 })
  const found = existing.data.find(
    (coupon) =>
      coupon.valid &&
      coupon.metadata?.[BANK_DISCOUNT_COUPON_METADATA] === 'true' &&
      coupon.percent_off === BANK_DISCOUNT_RATE * 100 &&
      coupon.duration === 'forever'
  )
  if (found) return found.id

  const created = await stripeBilling.coupons.create(
    {
      percent_off: BANK_DISCOUNT_RATE * 100,
      duration: 'forever',
      name: 'Bank payment',
      metadata: { [BANK_DISCOUNT_COUPON_METADATA]: 'true' },
    },
    { idempotencyKey: BANK_DISCOUNT_COUPON_IDEMPOTENCY }
  )
  return created.id
}

type CustomerDiscountUpdate = Stripe.CustomerUpdateParams & {
  discounts?: Array<{ coupon: string }> | ''
}

export async function reconcileCustomerBankDiscount(
  customerId: string,
  paymentMethodType: string | null
) {
  const wantsDiscount = paymentMethodType === 'us_bank_account'

  if (!wantsDiscount) {
    try {
      await stripeBilling.customers.deleteDiscount(customerId)
    } catch (err) {
      const code = err instanceof Stripe.errors.StripeError ? err.code : null
      if (code !== 'resource_missing') throw err
    }
    return
  }

  const couponId = await getBankDiscountCouponId()
  await stripeBilling.customers.update(customerId, {
    discounts: [{ coupon: couponId }],
  } as CustomerDiscountUpdate)
}

export async function ownedPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  const method = await stripeBilling.paymentMethods.retrieve(paymentMethodId)
  const methodCustomer =
    typeof method.customer === 'string' ? method.customer : method.customer?.id
  if (methodCustomer !== customerId) return null
  return method
}

export async function setCustomerDefaultPaymentMethod(
  customerId: string,
  method: Stripe.PaymentMethod | null
) {
  await stripeBilling.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: method?.id || '',
    },
  })
  await reconcileCustomerBankDiscount(customerId, method?.type ?? null)
}

function invoiceConfirmationSecret(invoice: Stripe.Invoice): string | null {
  const secret = invoice.confirmation_secret
  if (!secret || typeof secret === 'string') return null
  return secret.client_secret ?? null
}

async function paymentElementCustomerSessionSecret(customerId: string) {
  try {
    const session = await stripeBilling.customerSessions.create({
      customer: customerId,
      components: {
        payment_element: {
          enabled: true,
          features: {
            payment_method_redisplay: 'enabled',
            payment_method_allow_redisplay_filters: [
              'always',
              'limited',
              'unspecified',
            ],
          },
        },
      },
    })
    return session.client_secret
  } catch {
    return null
  }
}

export async function prepareInvoicePayment(
  invoice: Stripe.Invoice,
  paymentMethodType?: 'card' | 'us_bank_account'
) {
  const customerId = invoiceCustomerId(invoice)
  if (!customerId) {
    return { error: 'This invoice cannot be paid', status: 409 as const }
  }

  const sessionSecretPromise = paymentElementCustomerSessionSecret(customerId)
  let current = invoice

  if (current.status === 'draft') {
    const couponId = await getBankDiscountCouponId()
    const invoiceDiscounts: Stripe.InvoiceUpdateParams['discounts'] =
      paymentMethodType === 'us_bank_account' ? [{ coupon: couponId }] : ''

    await stripeBilling.invoices.update(current.id, {
      discounts: invoiceDiscounts,
      auto_advance: false,
    })

    current = await stripeBilling.invoices.finalizeInvoice(current.id, {
      auto_advance: false,
      expand: ['confirmation_secret'],
    })
  } else if (current.status === 'open') {
    current = await stripeBilling.invoices.retrieve(current.id, {
      expand: ['confirmation_secret'],
    })
  } else {
    return { error: 'This invoice cannot be paid', status: 409 as const }
  }

  if (current.amount_due <= 0) {
    return { error: 'This invoice cannot be paid', status: 409 as const }
  }

  const clientSecret = invoiceConfirmationSecret(current)
  if (!clientSecret) {
    return {
      error: 'Unable to start payment for this invoice',
      status: 409 as const,
    }
  }

  return {
    clientSecret,
    customerSessionClientSecret: await sessionSecretPromise,
    invoice: serializeInvoice(current),
  }
}

function isCurrentSubscription(status: Stripe.Subscription.Status) {
  return status !== 'canceled' && status !== 'incomplete_expired'
}

export async function listCustomerSubscriptions(customerId: string) {
  const subscriptions: Stripe.Subscription[] = []
  for await (const subscription of stripeBilling.subscriptions.list({
    customer: customerId,
    status: 'all',
    expand: [...SUBSCRIPTION_LIST_EXPAND],
    limit: 100,
  })) {
    subscriptions.push(subscription)
  }

  const openInvoices: Stripe.Invoice[] = []
  const draftInvoices: Stripe.Invoice[] = []
  for await (const invoice of stripeBilling.invoices.list({
    customer: customerId,
    status: 'open',
    limit: 100,
  })) {
    openInvoices.push(invoice)
  }
  for await (const invoice of stripeBilling.invoices.list({
    customer: customerId,
    status: 'draft',
    limit: 100,
  })) {
    draftInvoices.push(invoice)
  }

  const payableBySubscription = new Map<string, Stripe.Invoice>()
  for (const invoice of [...draftInvoices, ...openInvoices]) {
    const subscriptionId = invoiceSubscriptionId(invoice)
    if (subscriptionId && !payableBySubscription.has(subscriptionId)) {
      payableBySubscription.set(subscriptionId, invoice)
    }
  }

  const serialized = subscriptions.map((subscription) =>
    serializeSubscription(subscription, payableBySubscription.get(subscription.id))
  )

  return {
    current: serialized.filter((subscription) =>
      isCurrentSubscription(subscription.status)
    ),
    history: serialized.filter(
      (subscription) => !isCurrentSubscription(subscription.status)
    ),
  }
}

export async function getOwnedSubscription(
  customerId: string,
  subscriptionId: string
) {
  try {
    const subscription = await stripeBilling.subscriptions.retrieve(subscriptionId, {
      expand: [...SUBSCRIPTION_EXPAND],
    })
    if (subscriptionCustomerId(subscription) !== customerId) {
      return null
    }
    return subscription
  } catch (err) {
    const code = err instanceof Stripe.errors.StripeError ? err.code : null
    if (code === 'resource_missing') return null
    throw err
  }
}

export async function getOwnedSubscriptionDetail(
  customerId: string,
  subscriptionId: string
) {
  const subscription = await getOwnedSubscription(customerId, subscriptionId)
  if (!subscription) return null

  const [openInvoices, draftInvoices, methods] = await Promise.all([
    stripeBilling.invoices.list({
      customer: customerId,
      status: 'open',
      limit: 100,
    }),
    stripeBilling.invoices.list({
      customer: customerId,
      status: 'draft',
      limit: 100,
    }),
    listCustomerPaymentMethods(customerId),
  ])

  const payableInvoice =
    [...draftInvoices.data, ...openInvoices.data].find(
      (invoice) => invoiceSubscriptionId(invoice) === subscriptionId
    ) ?? null

  return {
    subscription: serializeSubscription(subscription, payableInvoice),
    methods: methods.map(serializePaymentMethod),
  }
}

export type InvoicePostPayState = {
  paidMethod: SerializedPaymentMethod | null
  defaultPaymentMethodId: string | null
  methods: SerializedPaymentMethod[]
  subscriptionId: string | null
  canEnableAutopay: boolean
  yearlyBankSavings: number
  currency: string
}

function idFromPaymentIntentMethod(
  paymentMethod: Stripe.PaymentIntent['payment_method']
) {
  if (!paymentMethod) return null
  return typeof paymentMethod === 'string' ? paymentMethod : paymentMethod.id
}

export async function getInvoicePostPayState(
  customerId: string,
  invoice: Stripe.Invoice,
  paymentIntentId?: string | null
): Promise<InvoicePostPayState> {
  const methods = await listCustomerPaymentMethods(customerId)
  const customer = await stripeBilling.customers.retrieve(customerId)
  const defaultPaymentMethod = customer.deleted
    ? null
    : customer.invoice_settings.default_payment_method
  const defaultPaymentMethodId =
    typeof defaultPaymentMethod === 'string'
      ? defaultPaymentMethod
      : defaultPaymentMethod?.id ?? null

  let paidMethod: SerializedPaymentMethod | null = null
  if (paymentIntentId?.startsWith('pi_')) {
    try {
      const paymentIntent = await stripeBilling.paymentIntents.retrieve(
        paymentIntentId
      )
      const intentCustomer =
        typeof paymentIntent.customer === 'string'
          ? paymentIntent.customer
          : paymentIntent.customer?.id
      if (intentCustomer === customerId) {
        const methodId = idFromPaymentIntentMethod(paymentIntent.payment_method)
        if (methodId) {
          const method = await stripeBilling.paymentMethods.retrieve(methodId)
          paidMethod = serializePaymentMethod(method)
        }
      }
    } catch (err) {
      const code = err instanceof Stripe.errors.StripeError ? err.code : null
      if (code !== 'resource_missing') throw err
    }
  }

  const subscriptionId = invoiceSubscriptionId(invoice)
  let canEnableAutopay = false
  let yearlyBankSavings = 0
  let currency = invoice.currency

  if (subscriptionId) {
    const subscription = await getOwnedSubscription(customerId, subscriptionId)
    if (subscription && isCurrentSubscription(subscription.status)) {
      canEnableAutopay =
        subscription.collection_method !== 'charge_automatically'
      const serialized = serializeSubscription(subscription)
      yearlyBankSavings = serialized.items.reduce((sum, item) => {
        const listAmount = item.amount * (item.quantity ?? 1)
        const periods = periodsPerYear(item.interval, item.intervalCount)
        return sum + Math.round(bankDiscountCents(listAmount) * (periods || 1))
      }, 0)
      currency = serialized.currency
    }
  }

  return {
    paidMethod,
    defaultPaymentMethodId,
    methods: methods.map(serializePaymentMethod),
    subscriptionId,
    canEnableAutopay,
    yearlyBankSavings,
    currency,
  }
}
