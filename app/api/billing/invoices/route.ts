import { NextResponse } from 'next/server'
import { listCustomerInvoices, requireBillingContext } from '@/app/utils/billing'

export async function GET() {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const invoices = await listCustomerInvoices(context.customerId)
  return NextResponse.json(invoices)
}
