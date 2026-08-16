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
}: FirstPaymentMethodSavedProps) {
  const who = customerName || customerEmail || 'A customer'

  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Preview>{who} saved a payment method</Preview>
        <Container style={container}>
          <Heading
            as="h1"
            style={{ color: '#18181b', fontSize: '24px', margin: '0 0 16px' }}
          >
            First payment method saved
          </Heading>
          <Text style={paragraph}>
            {who}
            {customerEmail && customerName ? ` (${customerEmail})` : ''} saved{' '}
            {methodLabel}. You can create their subscription in the Stripe
            Dashboard now — the customer discount will follow their default method.
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
} satisfies FirstPaymentMethodSavedProps

export default FirstPaymentMethodSaved
