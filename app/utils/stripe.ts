import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY || 'api_key_placeholder'

/**
 * Billing client. Preview API version is required for PaymentIntent surcharge fields.
 * Do not use this client for product checkout (landing page / domain).
 */
export const stripeBilling = new Stripe(secretKey, {
  apiVersion: '2026-03-25.preview' as Stripe.LatestApiVersion,
})

/** Historical API version used by product checkout PaymentIntents. */
export const STRIPE_PRODUCT_API_VERSION = '2023-08-16' as Stripe.LatestApiVersion
