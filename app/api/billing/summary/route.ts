import { NextResponse } from 'next/server'
import { getBillingAccountSummary } from '@/app/utils/billing'
import { requireBillingContext } from '@/app/utils/billingSession'

export const dynamic = 'force-dynamic'

export async function GET() {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const summary = await getBillingAccountSummary(context.customerIds)
  return NextResponse.json(summary)
}
