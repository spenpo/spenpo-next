import { InvoiceLayout, InvoiceEmailProps } from './components/InvoiceLayout'

export function InvoicePaymentFailed(props: InvoiceEmailProps) {
  return (
    <InvoiceLayout
      {...props}
      preview={`We couldn't collect ${props.amount} for invoice ${props.invoiceNumber}.`}
      heading="Payment failed"
      intro="We couldn't collect payment for this invoice. Please update your payment method or pay it in your billing account."
      amountLabel="Amount due"
      actionLabel="Pay invoice"
    />
  )
}

InvoicePaymentFailed.PreviewProps = {
  customerName: 'Alex',
  invoiceNumber: 'INV-1001',
  amount: '$250.00',
  dueDate: 'Aug 30, 2026',
  invoiceUrl: 'https://spenpo.com/account/billing/in_test',
} satisfies InvoiceEmailProps

export default InvoicePaymentFailed
