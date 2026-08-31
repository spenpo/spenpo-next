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
  paymentIntentStatus: Stripe.PaymentIntent.Status | null
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

export function asCustomerIds(customerId: string | string[]) {
  const ids = Array.isArray(customerId) ? customerId : [customerId]
  return ids.filter(Boolean)
}

const INVOICE_PAYMENT_INTENT_EXPAND = [
  'payments.data.payment.payment_intent',
] as const

export function invoicePaymentIntentStatus(
  invoice: Stripe.Invoice
): Stripe.PaymentIntent.Status | null {
  const payments = invoice.payments?.data ?? []
  const payment = payments.find((item) => item.is_default) ?? payments[0]
  const intent = payment?.payment?.payment_intent
  if (intent && typeof intent === 'object' && 'status' in intent) {
    return intent.status
  }
  return null
}

export function isInFlightInvoicePayment(
  paymentIntentStatus: string | null | undefined
) {
  return (
    paymentIntentStatus === 'processing' ||
    paymentIntentStatus === 'succeeded' ||
    paymentIntentStatus === 'requires_capture'
  )
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
    paymentIntentStatus: invoicePaymentIntentStatus(invoice),
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

function isCurrentSubscription(status: Stripe.Subscription.Status) {
  return status !== 'canceled' && status !== 'incomplete_expired'
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

export async function listCustomerInvoices(customerId: string | string[]) {
  const invoices: Stripe.Invoice[] = []
  const seen = new Set<string>()

  for (const id of asCustomerIds(customerId)) {
    for await (const invoice of stripeBilling.invoices.list({
      customer: id,
      limit: 100,
    })) {
      if (!invoice.status || seen.has(invoice.id)) continue
      seen.add(invoice.id)
      invoices.push(invoice)
    }
  }

  invoices.sort((a, b) => b.created - a.created)

  const drafts = invoices.filter((invoice) => invoice.status === 'draft')
  const open = invoices.filter((invoice) => invoice.status === 'open')
  const history = invoices.filter(
    (invoice) => invoice.status !== 'draft' && invoice.status !== 'open'
  )

  const openWithPayment = await Promise.all(
    open.map((invoice) =>
      stripeBilling.invoices.retrieve(invoice.id, {
        expand: [...INVOICE_PAYMENT_INTENT_EXPAND],
      })
    )
  )

  return {
    drafts: drafts.map(serializeInvoice),
    open: openWithPayment.map(serializeInvoice),
    history: history.map(serializeInvoice),
  }
}

export async function getOwnedInvoice(
  customerId: string | string[],
  invoiceId: string
) {
  const allowed = new Set(asCustomerIds(customerId))
  try {
    const invoice = await stripeBilling.invoices.retrieve(invoiceId, {
      expand: [...INVOICE_PAYMENT_INTENT_EXPAND],
    })
    const ownerId = invoiceCustomerId(invoice)
    if (!ownerId || !allowed.has(ownerId)) {
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

type BankDiscountParams = Stripe.InvoiceUpdateParams['discounts']

async function discountsForPaymentMethodType(
  paymentMethodType: string | null | undefined
): Promise<BankDiscountParams> {
  if (paymentMethodType !== 'us_bank_account') return ''
  return [{ coupon: await getBankDiscountCouponId() }]
}

async function customerDefaultPaymentMethodType(customerId: string) {
  const customer = await stripeBilling.customers.retrieve(customerId, {
    expand: ['invoice_settings.default_payment_method'],
  })
  if (customer.deleted) return null

  const method = customer.invoice_settings.default_payment_method
  if (!method) return null
  if (typeof method === 'string') {
    const retrieved = await stripeBilling.paymentMethods.retrieve(method)
    return retrieved.type
  }
  return method.type
}

async function applyBankDiscountToSubscription(
  subscriptionId: string,
  discounts: BankDiscountParams
) {
  await stripeBilling.subscriptions.update(subscriptionId, {
    discounts,
    proration_behavior: 'none',
  })
}

async function applyBankDiscountToDraftInvoice(
  invoice: Stripe.Invoice,
  discounts: BankDiscountParams
) {
  if (invoice.status !== 'draft') return
  await stripeBilling.invoices.update(invoice.id, { discounts })
}

export async function reconcileCustomerBankDiscount(
  customerId: string,
  paymentMethodType: string | null
) {
  const discounts = await discountsForPaymentMethodType(paymentMethodType)
  const updates: Promise<unknown>[] = []

  for await (const subscription of stripeBilling.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  })) {
    if (!isCurrentSubscription(subscription.status)) continue
    updates.push(applyBankDiscountToSubscription(subscription.id, discounts))
  }

  for await (const invoice of stripeBilling.invoices.list({
    customer: customerId,
    status: 'draft',
    limit: 100,
  })) {
    updates.push(applyBankDiscountToDraftInvoice(invoice, discounts))
  }

  await Promise.all(updates)
}

export async function reconcileDraftInvoiceBankDiscount(invoiceId: string) {
  const invoice = await stripeBilling.invoices.retrieve(invoiceId)
  if (invoice.status !== 'draft') return

  const customerId = invoiceCustomerId(invoice)
  if (!customerId) return

  const discounts = await discountsForPaymentMethodType(
    await customerDefaultPaymentMethodType(customerId)
  )
  await applyBankDiscountToDraftInvoice(invoice, discounts)

  const subscriptionId = invoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  const subscription = await stripeBilling.subscriptions.retrieve(subscriptionId)
  if (!isCurrentSubscription(subscription.status)) return
  await applyBankDiscountToSubscription(subscription.id, discounts)
}

export async function reconcileSubscriptionBankDiscount(subscriptionId: string) {
  const subscription = await stripeBilling.subscriptions.retrieve(subscriptionId)
  if (!isCurrentSubscription(subscription.status)) return

  const discounts = await discountsForPaymentMethodType(
    await customerDefaultPaymentMethodType(subscriptionCustomerId(subscription))
  )
  await applyBankDiscountToSubscription(subscription.id, discounts)
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

export async function prepareInvoicePayment(invoice: Stripe.Invoice) {
  const customerId = invoiceCustomerId(invoice)
  if (!customerId) {
    return { error: 'This invoice cannot be paid', status: 409 as const }
  }

  let current = invoice

  if (current.status === 'draft') {
    await stripeBilling.invoices.update(current.id, {
      auto_advance: false,
    })

    current = await stripeBilling.invoices.finalizeInvoice(current.id, {
      auto_advance: false,
      expand: ['confirmation_secret', ...INVOICE_PAYMENT_INTENT_EXPAND],
    })
  } else if (current.status === 'open') {
    current = await stripeBilling.invoices.retrieve(current.id, {
      expand: ['confirmation_secret', ...INVOICE_PAYMENT_INTENT_EXPAND],
    })
  } else {
    return { error: 'This invoice cannot be paid', status: 409 as const }
  }

  const paymentIntentStatus = invoicePaymentIntentStatus(current)
  if (isInFlightInvoicePayment(paymentIntentStatus)) {
    return {
      clientSecret: null,
      customerSessionClientSecret: null,
      paymentIntentStatus,
      invoice: serializeInvoice(current),
    }
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
    customerSessionClientSecret:
      await paymentElementCustomerSessionSecret(customerId),
    paymentIntentStatus,
    invoice: serializeInvoice(current),
  }
}

export async function listCustomerSubscriptions(customerId: string | string[]) {
  const subscriptions: Stripe.Subscription[] = []
  const seenSubscriptions = new Set<string>()
  const openInvoices: Stripe.Invoice[] = []
  const draftInvoices: Stripe.Invoice[] = []
  const seenInvoices = new Set<string>()

  for (const id of asCustomerIds(customerId)) {
    for await (const subscription of stripeBilling.subscriptions.list({
      customer: id,
      status: 'all',
      expand: [...SUBSCRIPTION_LIST_EXPAND],
      limit: 100,
    })) {
      if (seenSubscriptions.has(subscription.id)) continue
      seenSubscriptions.add(subscription.id)
      subscriptions.push(subscription)
    }

    for await (const invoice of stripeBilling.invoices.list({
      customer: id,
      status: 'open',
      limit: 100,
    })) {
      if (seenInvoices.has(invoice.id)) continue
      seenInvoices.add(invoice.id)
      openInvoices.push(invoice)
    }
    for await (const invoice of stripeBilling.invoices.list({
      customer: id,
      status: 'draft',
      limit: 100,
    })) {
      if (seenInvoices.has(invoice.id)) continue
      seenInvoices.add(invoice.id)
      draftInvoices.push(invoice)
    }
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
  customerId: string | string[],
  subscriptionId: string
) {
  const allowed = new Set(asCustomerIds(customerId))
  try {
    const subscription = await stripeBilling.subscriptions.retrieve(subscriptionId, {
      expand: [...SUBSCRIPTION_EXPAND],
    })
    if (!allowed.has(subscriptionCustomerId(subscription))) {
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
  customerId: string | string[],
  subscriptionId: string
) {
  const subscription = await getOwnedSubscription(customerId, subscriptionId)
  if (!subscription) return null

  const ownerId = subscriptionCustomerId(subscription)
  const [openInvoices, draftInvoices, methods] = await Promise.all([
    stripeBilling.invoices.list({
      customer: ownerId,
      status: 'open',
      limit: 100,
    }),
    stripeBilling.invoices.list({
      customer: ownerId,
      status: 'draft',
      limit: 100,
    }),
    listCustomerPaymentMethods(ownerId),
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
