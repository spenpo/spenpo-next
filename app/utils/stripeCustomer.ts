import { Prisma, User } from '@prisma/client'
import Stripe from 'stripe'
import prisma from '@/app/utils/prisma'
import { stripeBilling } from '@/app/utils/stripe'
import { normalizeEmail } from '@/app/utils/billingAuth'

const EMAIL_MATCH_LIMIT = 10

export type BillingCustomers = {
  customerId: string
  customerIds: string[]
}

async function customerSignals(customerId: string) {
  const [invoices, subscriptions] = await Promise.all([
    stripeBilling.invoices.list({ customer: customerId, limit: 1 }),
    stripeBilling.subscriptions.list({
      customer: customerId,
      limit: 1,
    }),
  ])
  return {
    hasSubscription: subscriptions.data.length > 0,
    hasHistory: invoices.data.length > 0 || subscriptions.data.length > 0,
  }
}

function uniqueCustomers(customers: Stripe.Customer[]) {
  const seen = new Set<string>()
  const unique: Stripe.Customer[] = []
  for (const customer of customers) {
    if (seen.has(customer.id)) continue
    seen.add(customer.id)
    unique.push(customer)
  }
  return unique
}

export async function listStripeCustomersForEmail(email: string) {
  const queries = Array.from(new Set([email, normalizeEmail(email)]))
  const lists = await Promise.all(
    queries.map((query) =>
      stripeBilling.customers.list({
        email: query,
        limit: EMAIL_MATCH_LIMIT,
      })
    )
  )
  return uniqueCustomers(
    lists.flatMap((list) => list.data.filter((customer) => !customer.deleted))
  )
}

async function retrieveLivingCustomer(customerId: string) {
  try {
    const customer = await stripeBilling.customers.retrieve(customerId)
    if (customer.deleted) return null
    return customer
  } catch (err) {
    const code = err instanceof Stripe.errors.StripeError ? err.code : null
    if (code === 'resource_missing') return null
    throw err
  }
}

async function pickCanonicalCustomer(customers: Stripe.Customer[]) {
  if (customers.length === 1) return customers[0]

  const scored = await Promise.all(
    customers.map(async (customer) => ({
      customer,
      ...(await customerSignals(customer.id)),
    }))
  )

  scored.sort((a, b) => {
    if (a.hasSubscription !== b.hasSubscription) {
      return a.hasSubscription ? -1 : 1
    }
    if (a.hasHistory !== b.hasHistory) {
      return a.hasHistory ? -1 : 1
    }
    return b.customer.created - a.customer.created
  })

  return scored[0].customer
}

async function persistCustomerId(userId: string, customerId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const again = await prisma.user.findUnique({ where: { id: userId } })
      if (again?.stripeCustomerId) return again.stripeCustomerId
    }
    throw err
  }
  return customerId
}

export async function getBillingCustomers(user: User): Promise<BillingCustomers> {
  if (!user.email) {
    throw new Error('An email address is required to create a Stripe customer')
  }

  const [byEmail, stored] = await Promise.all([
    listStripeCustomersForEmail(user.email),
    user.stripeCustomerId
      ? retrieveLivingCustomer(user.stripeCustomerId)
      : Promise.resolve(null),
  ])

  const living = uniqueCustomers([...byEmail, ...(stored ? [stored] : [])])

  if (living.length === 0) {
    const created = await stripeBilling.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    })
    const customerId = await persistCustomerId(user.id, created.id)
    return { customerId, customerIds: [customerId] }
  }

  const canonical = await pickCanonicalCustomer(living)
  const customerId =
    canonical.id === user.stripeCustomerId
      ? canonical.id
      : await persistCustomerId(user.id, canonical.id)

  return {
    customerId,
    customerIds: living.map((customer) => customer.id),
  }
}

export async function getOrCreateStripeCustomer(user: User): Promise<string> {
  const { customerId } = await getBillingCustomers(user)
  return customerId
}

export async function ensureBillingUserForEmail(
  email: string,
  options?: { name?: string | null }
) {
  const normalized = normalizeEmail(email)
  const name = options?.name?.trim() || null

  let user =
    (await prisma.user.findUnique({ where: { email: normalized } })) ??
    (normalized !== email
      ? await prisma.user.findUnique({ where: { email } })
      : null)

  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          email: normalized,
          name,
        },
      })
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        user =
          (await prisma.user.findUnique({ where: { email: normalized } })) ??
          (await prisma.user.findUnique({ where: { email } }))
      } else {
        throw err
      }
    }
  }

  if (!user) {
    throw new Error('Unable to create billing user')
  }

  if (name && !user.name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name },
    })
  }

  await getBillingCustomers(user)
  return user
}
