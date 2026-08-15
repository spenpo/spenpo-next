import { InvoiceLayout, InvoiceEmailProps } from './components/InvoiceLayout'

export function InvoicePaid(props: InvoiceEmailProps) {
  return (
    <InvoiceLayout
      {...props}
      preview={`We received ${props.amount} for invoice ${props.invoiceNumber}.`}
      heading="Payment received"
      intro="Thank you. We received your payment for this invoice."
      amountLabel="Amount paid"
      actionLabel="View invoice"
      showDueDate={false}
    />
  )
}

InvoicePaid.PreviewProps = {
  customerName: 'Alex',
  invoiceNumber: 'INV-1001',
  amount: '$250.00',
  dueDate: null,
  invoiceUrl: 'https://spenpo.com/account/billing/in_test',
} satisfies InvoiceEmailProps

export default InvoicePaid
