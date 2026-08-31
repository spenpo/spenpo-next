import { InvoiceLayout, InvoiceEmailProps } from './components/InvoiceLayout'

export function InvoiceOverdue(props: InvoiceEmailProps) {
  return (
    <InvoiceLayout
      {...props}
      preview={`Invoice ${props.invoiceNumber} for ${props.amount} is past due.`}
      heading="Your invoice is overdue"
      intro="This invoice is past due. Use the button to open your Spenpo billing account — no password — and pay it as soon as you can."
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
  invoiceUrl: 'https://spenpo.com/api/auth/callback/email?callbackUrl=%2Faccount%2Fbilling%2Fin_test&token=example&email=alex%40example.com',
  billedEmail: 'alex@example.com',
  signInUrl: 'https://spenpo.com/auth/signin?redirect=%2Faccount%2Fbilling%2Fin_test&email=alex%40example.com',
  linkExpiresDays: 7,
} satisfies InvoiceEmailProps

export default InvoiceOverdue
