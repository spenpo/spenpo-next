import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvoice, prepareInvoicePayment } from '@/app/utils/billing'
import { requireBillingContext } from '@/app/utils/billingSession'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const invoice = await getOwnedInvoice(context.customerIds, params.id)
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  try {
    const result = await prepareInvoicePayment(invoice)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to start payment'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
