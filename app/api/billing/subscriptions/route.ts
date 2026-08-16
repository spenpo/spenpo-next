import { NextResponse } from 'next/server'
import {
  listCustomerSubscriptions,
  requireBillingContext,
} from '@/app/utils/billing'

export async function GET() {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const subscriptions = await listCustomerSubscriptions(context.customerId)
  return NextResponse.json(subscriptions)
}
