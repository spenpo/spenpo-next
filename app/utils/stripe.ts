import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY || 'api_key_placeholder'

/** Billing client. GA API version; invoices use confirmation_secret for Payment Element. */
export const stripeBilling = new Stripe(secretKey, {
  apiVersion: '2026-07-29.dahlia',
})

/** Historical API version used by product checkout PaymentIntents. */
export const STRIPE_PRODUCT_API_VERSION = '2023-08-16' as Stripe.LatestApiVersion

/**
 * Product checkout client (landing page / domain). Placeholder key is for
 * Next.js build-time module evaluation when STRIPE_SECRET_KEY is unset.
 */
export const stripeProduct = new Stripe(secretKey, {
  apiVersion: STRIPE_PRODUCT_API_VERSION,
})
