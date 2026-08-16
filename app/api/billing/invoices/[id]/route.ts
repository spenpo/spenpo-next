import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvoice, serializeInvoice } from '@/app/utils/billing'
import { requireBillingContext } from '@/app/utils/billingSession'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const invoice = await getOwnedInvoice(context.customerId, params.id)
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json({ invoice: serializeInvoice(invoice) })
}
