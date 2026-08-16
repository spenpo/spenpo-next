import { NextResponse } from 'next/server'
import { requireBillingContext } from '@/app/utils/billingSession'
import { stripeBilling } from '@/app/utils/stripe'

export async function POST() {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const setupIntent = await stripeBilling.setupIntents.create({
    customer: context.customerId,
    usage: 'off_session',
  })

  return NextResponse.json({ clientSecret: setupIntent.client_secret })
}
