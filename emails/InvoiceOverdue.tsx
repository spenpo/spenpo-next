import { InvoiceLayout, InvoiceEmailProps } from './components/InvoiceLayout'

export function InvoiceOverdue(props: InvoiceEmailProps) {
  return (
    <InvoiceLayout
      {...props}
      preview={`Invoice ${props.invoiceNumber} for ${props.amount} is past due.`}
      heading="Your invoice is overdue"
      intro="This invoice is past due. Please pay it as soon as you can from your billing account."
      amountLabel="Amount due"
      actionLabel="Pay invoice"
    />
  )
}

InvoiceOverdue.PreviewProps = {
  customerName: 'Alex',
  invoiceNumber: 'INV-1001',
  amount: '$250.00',
  dueDate: 'Aug 1, 2026',
  invoiceUrl: 'https://spenpo.com/account/billing/in_test',
} satisfies InvoiceEmailProps

export default InvoiceOverdue
