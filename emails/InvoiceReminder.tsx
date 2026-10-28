import { InvoiceLayout, InvoiceEmailProps } from './components/InvoiceLayout'

export function InvoiceReminder(props: InvoiceEmailProps) {
  return (
    <InvoiceLayout
      {...props}
      preview={`Friendly reminder: Invoice ${props.invoiceNumber} for ${props.amount} is awaiting payment.`}
      heading="Friendly Invoice Reminder"
      intro="Just a quick, friendly reminder that you have an open invoice awaiting payment. Use the button below to review your invoice and pay securely — no password required. If you have already sent payment, please disregard this reminder."
      amountLabel="Amount due"
      actionLabel="Review & Pay Invoice"
    />
  )
}

InvoiceReminder.PreviewProps = {
  customerName: 'Barb',
  invoiceNumber: 'INV-1002',
  amount: '$150.00',
  dueDate: 'Nov 15, 2026',
  invoiceUrl: 'https://spenpo.com/account/billing',
  billedEmail: 'barb@example.com',
  signInUrl: null,
  linkExpiresDays: 7,
} satisfies InvoiceEmailProps

export default InvoiceReminder
