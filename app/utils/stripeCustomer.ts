import { Prisma, User } from '@prisma/client'
import Stripe from 'stripe'
import prisma from '@/app/utils/prisma'
import { stripeBilling } from '@/app/utils/stripe'

const EMAIL_MATCH_LIMIT = 10

async function customerHasBillingHistory(customerId: string) {
  const [invoices, subscriptions] = await Promise.all([
    stripeBilling.invoices.list({ customer: customerId, limit: 1 }),
    stripeBilling.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    }),
  ])
  return invoices.data.length > 0 || subscriptions.data.length > 0
}

async function findStripeCustomerForEmail(email: string) {
  const matches = await stripeBilling.customers.list({
    email,
    limit: EMAIL_MATCH_LIMIT,
  })
  const living = matches.data
    .filter((customer) => !customer.deleted)
    .slice()
    .sort((a, b) => b.created - a.created)

  for (const candidate of living) {
    if (await customerHasBillingHistory(candidate.id)) return candidate
  }
  return living[0] ?? null
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

export async function getOrCreateStripeCustomer(user: User): Promise<string> {
  if (user.stripeCustomerId) {
    try {
      const existing = await stripeBilling.customers.retrieve(user.stripeCustomerId)
      if (!existing.deleted) {
        if (await customerHasBillingHistory(existing.id)) return existing.id

        if (user.email) {
          const better = await findStripeCustomerForEmail(user.email)
          if (
            better &&
            better.id !== existing.id &&
            (await customerHasBillingHistory(better.id))
          ) {
            return persistCustomerId(user.id, better.id)
          }
        }

        return existing.id
      }
    } catch (err) {
      const code = err instanceof Stripe.errors.StripeError ? err.code : null
      if (code !== 'resource_missing') throw err
    }
  }

  if (!user.email) {
    throw new Error('An email address is required to create a Stripe customer')
  }

  const matched = await findStripeCustomerForEmail(user.email)
  if (matched) return persistCustomerId(user.id, matched.id)

  const created = await stripeBilling.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  })
  return persistCustomerId(user.id, created.id)
}
