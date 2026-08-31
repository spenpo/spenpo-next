import { InvoiceLayout, InvoiceEmailProps } from './components/InvoiceLayout'

export function InvoiceReady(props: InvoiceEmailProps) {
  return (
    <InvoiceLayout
      {...props}
      preview={`Invoice ${props.invoiceNumber} for ${props.amount} is ready to pay.`}
      heading="Your invoice is ready"
      intro="A new invoice is ready. Use the button to create or open your Spenpo billing account — no password — then review and pay. After you pay, you can save a payment method or turn on autopay."
      amountLabel="Amount due"
      actionLabel="Open billing and pay"
    />
  )
}

InvoiceReady.PreviewProps = {
  customerName: 'Alex',
  invoiceNumber: 'INV-1001',
  amount: '$250.00',
  dueDate: 'Aug 30, 2026',
  invoiceUrl: 'https://spenpo.com/api/auth/callback/email?callbackUrl=%2Faccount%2Fbilling%2Fin_test&token=example&email=alex%40example.com',
  billedEmail: 'alex@example.com',
  signInUrl: 'https://spenpo.com/auth/signin?redirect=%2Faccount%2Fbilling%2Fin_test&email=alex%40example.com',
  linkExpiresDays: 7,
} satisfies InvoiceEmailProps

export default InvoiceReady
