import { createHash, randomBytes } from 'crypto'
import prisma from '@/app/utils/prisma'
import { normalizeEmail } from '@/app/utils/billingAuth'
import { ensureBillingUserForEmail } from '@/app/utils/stripeCustomer'

export const INVOICE_SIGN_IN_DAYS = 7
const FALLBACK_SITE_URL = 'https://spenpo.com'

function siteUrl() {
  return (process.env.NEXTAUTH_URL || FALLBACK_SITE_URL).replace(/\/$/, '')
}

export function invoicePayPath(invoiceId: string, email?: string | null) {
  const url = new URL(`${siteUrl()}/account/billing/${invoiceId}`)
  if (email) url.searchParams.set('email', email)
  return `${url.pathname}${url.search}`
}

export function invoicePayUrl(invoiceId: string, email?: string | null) {
  return `${siteUrl()}${invoicePayPath(invoiceId, email)}`
}

export function invoiceSignInUrl(invoiceId: string, email: string) {
  const params = new URLSearchParams()
  params.set('redirect', invoicePayPath(invoiceId, email))
  params.set('email', email)
  return `${siteUrl()}/auth/signin?${params.toString()}`
}

function hashEmailToken(token: string) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null
  return createHash('sha256').update(`${token}${secret}`).digest('hex')
}

export async function createInvoiceMagicLink(
  email: string,
  invoiceId: string,
  options?: { name?: string | null }
) {
  if (!process.env.NEXTAUTH_SECRET) {
    console.log('billing invoice magic link skipped: NEXTAUTH_SECRET is not set')
    return null
  }

  try {
    await ensureBillingUserForEmail(email, { name: options?.name })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log('billing invoice user stub failed', message)
  }

  const identifier = normalizeEmail(email)
  const token = randomBytes(32).toString('hex')
  const hashed = hashEmailToken(token)
  if (!hashed) return null

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashed,
      expires: new Date(
        Date.now() + INVOICE_SIGN_IN_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  })

  const params = new URLSearchParams({
    callbackUrl: invoicePayUrl(invoiceId, identifier),
    token,
    email: identifier,
  })
  return `${siteUrl()}/api/auth/callback/email?${params.toString()}`
}
