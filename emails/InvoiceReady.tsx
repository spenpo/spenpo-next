import { InvoiceLayout, InvoiceEmailProps } from './components/InvoiceLayout'

export function InvoiceReady(props: InvoiceEmailProps) {
  return (
    <InvoiceLayout
      {...props}
      preview={`Invoice ${props.invoiceNumber} for ${props.amount} is ready to pay.`}
      heading="Your invoice is ready"
      intro="A new invoice is ready. You can review the details and pay it in your billing account."
      amountLabel="Amount due"
      actionLabel="Pay invoice"
    />
  )
}

InvoiceReady.PreviewProps = {
  customerName: 'Alex',
  invoiceNumber: 'INV-1001',
  amount: '$250.00',
  dueDate: 'Aug 30, 2026',
  invoiceUrl: 'https://spenpo.com/account/billing/in_test',
} satisfies InvoiceEmailProps

export default InvoiceReady
