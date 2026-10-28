import { NextRequest, NextResponse } from 'next/server'
import { settleCustomerAccount } from '@/app/utils/billing'
import { requireBillingContext } from '@/app/utils/billingSession'

export async function POST(req: NextRequest) {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const body = (await req.json().catch(() => ({}))) as {
    paymentMethodId?: string
    enableAutopay?: boolean
  }

  const result = await settleCustomerAccount(
    context.customerId,
    context.customerIds,
    {
      paymentMethodId: body.paymentMethodId,
      enableAutopay: body.enableAutopay ?? true,
    }
  )

  return NextResponse.json(result)
}
