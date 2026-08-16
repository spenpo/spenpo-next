import { CSSProperties } from 'react'
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
  Text,
} from 'react-email'

export type SignInMagicLinkProps = {
  url: string
  email: string
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

export function SignInMagicLink({ url, email }: SignInMagicLinkProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Preview>Your Spenpo sign-in link for {email}</Preview>
        <Container style={container}>
          <Heading
            as="h1"
            style={{ color: '#18181b', fontSize: '24px', margin: '0 0 16px' }}
          >
            Your Spenpo sign-in link
          </Heading>
          <Text style={paragraph}>
            Use this link to open your account as {email} so you can pay invoices or
            set up autopay. It expires in 24 hours and can only be used once.
          </Text>
          <Button href={url} style={button}>
            Continue to your account
          </Button>
          <Text style={{ ...paragraph, marginTop: '24px' }}>
            If you did not request this, you can ignore this email.
          </Text>
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

SignInMagicLink.PreviewProps = {
  url: 'https://spenpo.com/api/auth/callback/email?token=example',
  email: 'alex@example.com',
} satisfies SignInMagicLinkProps

export default SignInMagicLink
