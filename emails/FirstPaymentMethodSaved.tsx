import { CSSProperties } from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'react-email'

export type FirstPaymentMethodSavedProps = {
  customerName: string | null
  customerEmail: string | null
  methodLabel: string
  dashboardUrl: string
  unpaidInvoicesCount?: number
  unpaidInvoicesAmount?: string | null
  autopayStatus?: 'enabled' | 'disabled' | 'none'
}

const body: CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '24px 0',
}

const container: CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '32px',
}

const paragraph: CSSProperties = {
  color: '#3f3f46',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const alertBox: CSSProperties = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '6px',
  color: '#92400e',
  padding: '12px 16px',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
}

const button: CSSProperties = {
  backgroundColor: '#111827',
  borderRadius: '6px',
  boxSizing: 'border-box',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 600,
  lineHeight: '20px',
  padding: '12px 20px',
  textAlign: 'center',
  textDecoration: 'none',
}

export function FirstPaymentMethodSaved({
  customerName,
  customerEmail,
  methodLabel,
  dashboardUrl,
  unpaidInvoicesCount = 0,
  unpaidInvoicesAmount,
  autopayStatus = 'none',
}: FirstPaymentMethodSavedProps) {
  const who = customerName || customerEmail || 'A customer'
  const hasUnpaid = unpaidInvoicesCount > 0
  const isAutopayOff = autopayStatus === 'disabled'

  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Preview>
          {who} saved a payment method
          {hasUnpaid ? ` · ${unpaidInvoicesAmount} unpaid` : ''}
        </Preview>
        <Container style={container}>
          <Heading
            as="h1"
            style={{ color: '#18181b', fontSize: '24px', margin: '0 0 16px' }}
          >
            Payment method saved
          </Heading>
          <Text style={paragraph}>
            {who}
            {customerEmail && customerName ? ` (${customerEmail})` : ''} saved{' '}
            {methodLabel}.
          </Text>

          {hasUnpaid && (
            <div style={alertBox}>
              <strong>⚠️ Open Balance:</strong> Customer has{' '}
              {unpaidInvoicesCount} unpaid invoice(s) totaling{' '}
              {unpaidInvoicesAmount}. Note that saving a payment method does not
              automatically charge existing invoices.
            </div>
          )}

          {isAutopayOff && (
            <div style={alertBox}>
              <strong>⚠️ Autopay Disabled:</strong> This customer has an active
              subscription, but autopay is currently OFF (set to send invoices).
            </div>
          )}

          <Text style={paragraph}>
            You can view this customer, charge open invoices, or toggle automatic
            collection in the Stripe Dashboard.
          </Text>

          <Button href={dashboardUrl} style={button}>
            Open customer in Stripe
          </Button>
          <Hr
            style={{
              borderColor: '#e4e4e7',
              borderStyle: 'solid',
              margin: '32px 0 16px',
            }}
          />
          <Text style={{ color: '#71717a', fontSize: '12px', margin: 0 }}>
            Spenpo billing
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

FirstPaymentMethodSaved.PreviewProps = {
  customerName: 'Alex',
  customerEmail: 'alex@example.com',
  methodLabel: 'Bank •••• 6789',
  dashboardUrl: 'https://dashboard.stripe.com/test/customers/cus_test',
  unpaidInvoicesCount: 1,
  unpaidInvoicesAmount: '$150.00',
  autopayStatus: 'disabled',
} satisfies FirstPaymentMethodSavedProps

export default FirstPaymentMethodSaved
