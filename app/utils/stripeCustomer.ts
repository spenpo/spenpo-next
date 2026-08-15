import { Prisma, User } from '@prisma/client'
import Stripe from 'stripe'
import prisma from '@/app/utils/prisma'
import { stripeBilling } from '@/app/utils/stripe'

const EMAIL_MATCH_LIMIT = 10

export async function getOrCreateStripeCustomer(user: User): Promise<string> {
  if (user.stripeCustomerId) {
    try {
      const existing = await stripeBilling.customers.retrieve(user.stripeCustomerId)
      if (!existing.deleted) return existing.id
    } catch (err) {
      const code = err instanceof Stripe.errors.StripeError ? err.code : null
      if (code !== 'resource_missing') throw err
    }
  }

  if (!user.email) {
    throw new Error('An email address is required to create a Stripe customer')
  }

  const matches = await stripeBilling.customers.list({
    email: user.email,
    limit: EMAIL_MATCH_LIMIT,
  })

  let chosen = matches.data.slice().sort((a, b) => b.created - a.created)[0]

  if (matches.data.length > 1) {
    for (const candidate of matches.data) {
      const invoices = await stripeBilling.invoices.list({
        customer: candidate.id,
        limit: 1,
      })
      if (invoices.data.length > 0) {
        chosen = candidate
        break
      }
    }
  }

  const customerId =
    chosen?.id ??
    (
      await stripeBilling.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      })
    ).id

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const again = await prisma.user.findUnique({ where: { id: user.id } })
      if (again?.stripeCustomerId) return again.stripeCustomerId
    }
    throw err
  }

  return customerId
}
