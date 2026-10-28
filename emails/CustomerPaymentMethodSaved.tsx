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

export type CustomerPaymentMethodSavedProps = {
  customerName: string | null
  methodLabel: string
  unpaidInvoicesCount?: number
  unpaidAmount?: string | null
  actionUrl: string
  autopayEnabled?: boolean
  hasActiveSubscription?: boolean
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
  padding: '16px',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 20px',
}

const successBox: CSSProperties = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #10b981',
  borderRadius: '6px',
  color: '#065f46',
  padding: '16px',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 20px',
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

export function CustomerPaymentMethodSaved({
  customerName,
  methodLabel,
  unpaidInvoicesCount = 0,
  unpaidAmount,
  actionUrl,
  autopayEnabled = false,
  hasActiveSubscription = false,
}: CustomerPaymentMethodSavedProps) {
  const greeting = customerName ? `Hi ${customerName},` : 'Hi,'
  const hasUnpaid = unpaidInvoicesCount > 0

  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Preview>
          {hasUnpaid
            ? `Your payment method was saved · ${unpaidAmount} open balance`
            : 'Your payment method has been saved'}
        </Preview>
        <Container style={container}>
          <Heading
            as="h1"
            style={{ color: '#18181b', fontSize: '24px', margin: '0 0 16px' }}
          >
            Payment method saved
          </Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            Your payment method (<strong>{methodLabel}</strong>) has been
            securely saved to your Spenpo account.
          </Text>

          {hasUnpaid ? (
            <div style={alertBox}>
              <strong>Notice:</strong> You currently have{' '}
              {unpaidInvoicesCount} unpaid invoice(s) totaling{' '}
              <strong>{unpaidAmount}</strong>.
              <br />
              <br />
              Saving a payment method does not automatically charge existing
              invoices. Click below to pay your open balance and turn on autopay
              for future months in one click.
            </div>
          ) : hasActiveSubscription && !autopayEnabled ? (
            <div style={alertBox}>
              <strong>Autopay is off:</strong> You have an active subscription,
              but automatic monthly payments are currently turned off. Click
              below to turn on autopay so you don&apos;t have to worry about
              manual invoices.
            </div>
          ) : (
            <div style={successBox}>
              <strong>All caught up!</strong> Your account is in good standing.
              {hasActiveSubscription && autopayEnabled
                ? ' Future monthly invoices will be automatically charged to this payment method.'
                : ''}
            </div>
          )}

          <Button href={actionUrl} style={button}>
            {hasUnpaid
              ? `Review & Pay ${unpaidAmount}`
              : hasActiveSubscription && !autopayEnabled
                ? 'Turn On Autopay'
                : 'Open Billing Portal'}
          </Button>

          <Hr
            style={{
              borderColor: '#e4e4e7',
              borderStyle: 'solid',
              margin: '32px 0 16px',
            }}
          />
          <Text style={{ color: '#71717a', fontSize: '12px', margin: 0 }}>
            Spenpo Billing · Questions? Reply directly to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

CustomerPaymentMethodSaved.PreviewProps = {
  customerName: 'Barb',
  methodLabel: 'Visa ending in 4242',
  unpaidInvoicesCount: 1,
  unpaidAmount: '$150.00',
  actionUrl: 'https://spenpo.com/account/billing',
  autopayEnabled: false,
  hasActiveSubscription: true,
} satisfies CustomerPaymentMethodSavedProps

export default CustomerPaymentMethodSaved
