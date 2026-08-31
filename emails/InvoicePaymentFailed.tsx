import { InvoiceLayout, InvoiceEmailProps } from './components/InvoiceLayout'

export function InvoicePaymentFailed(props: InvoiceEmailProps) {
  return (
    <InvoiceLayout
      {...props}
      preview={`We couldn't collect ${props.amount} for invoice ${props.invoiceNumber}.`}
      heading="Payment failed"
      intro="We couldn't collect payment for this invoice. Use the button to open your Spenpo billing account — no password — then update your payment method or pay."
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
  invoiceUrl: 'https://spenpo.com/api/auth/callback/email?callbackUrl=%2Faccount%2Fbilling%2Fin_test&token=example&email=alex%40example.com',
  billedEmail: 'alex@example.com',
  signInUrl: 'https://spenpo.com/auth/signin?redirect=%2Faccount%2Fbilling%2Fin_test&email=alex%40example.com',
  linkExpiresDays: 7,
} satisfies InvoiceEmailProps

export default InvoicePaymentFailed
