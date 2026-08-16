import { CSSProperties, ReactNode } from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'react-email'

export type InvoiceEmailProps = {
  customerName: string | null
  invoiceNumber: string
  amount: string
  dueDate: string | null
  invoiceUrl: string
  billedEmail?: string | null
  hostedInvoiceUrl?: string | null
}

type InvoiceLayoutProps = InvoiceEmailProps & {
  preview: string
  heading: string
  intro: ReactNode
  amountLabel: string
  actionLabel: string
  showDueDate?: boolean
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

const detail: CSSProperties = {
  color: '#3f3f46',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 8px',
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

export function InvoiceLayout({
  preview,
  heading,
  customerName,
  intro,
  invoiceNumber,
  amountLabel,
  amount,
  dueDate,
  showDueDate = true,
  invoiceUrl,
  actionLabel,
  billedEmail,
  hostedInvoiceUrl,
}: InvoiceLayoutProps) {
  const greeting = customerName ? `Hi ${customerName},` : 'Hi,'

  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Preview>{preview}</Preview>
        <Container style={container}>
          <Heading
            as="h1"
            style={{ color: '#18181b', fontSize: '24px', margin: '0 0 16px' }}
          >
            {heading}
          </Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>{intro}</Text>
          {billedEmail ? (
            <Text style={paragraph}>Sign in as {billedEmail} to view this invoice.</Text>
          ) : null}
          <Section style={{ margin: '8px 0 24px' }}>
            <Text style={detail}>Invoice: {invoiceNumber}</Text>
            <Text style={detail}>
              {amountLabel}: {amount}
            </Text>
            {showDueDate && dueDate ? (
              <Text style={{ ...detail, margin: 0 }}>Due: {dueDate}</Text>
            ) : null}
          </Section>
          <Button href={invoiceUrl} style={button}>
            {actionLabel}
          </Button>
          {hostedInvoiceUrl ? (
            <Text style={{ ...paragraph, marginTop: '16px', marginBottom: 0 }}>
              <Link href={hostedInvoiceUrl} style={{ color: '#111827' }}>
                Pay without signing in
              </Link>
            </Text>
          ) : null}
          <Hr
            style={{
              borderColor: '#e4e4e7',
              borderStyle: 'solid',
              margin: '32px 0 16px',
            }}
          />
          <Text style={{ color: '#71717a', fontSize: '12px', margin: 0 }}>
            Spenpo ·{' '}
            <Link href="https://spenpo.com" style={{ color: '#71717a' }}>
              spenpo.com
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
