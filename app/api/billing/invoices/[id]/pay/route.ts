import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvoice, prepareInvoicePayment } from '@/app/utils/billing'
import { requireBillingContext } from '@/app/utils/billingSession'

type PayBody = {
  paymentMethodType?: 'card' | 'us_bank_account'
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  let body: PayBody = {}
  try {
    body = (await req.json()) as PayBody
  } catch {
    body = {}
  }

  const invoice = await getOwnedInvoice(context.customerId, params.id)
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const paymentMethodType =
    body.paymentMethodType === 'us_bank_account' || body.paymentMethodType === 'card'
      ? body.paymentMethodType
      : undefined

  if (invoice.status === 'draft' && !paymentMethodType) {
    return NextResponse.json(
      { error: 'Choose card or bank before paying this invoice.' },
      { status: 400 }
    )
  }

  try {
    const result = await prepareInvoicePayment(invoice, paymentMethodType)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to start payment'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
