import { SignInMagicLink } from '@/emails/SignInMagicLink'
import { renderEmail, resend } from '@/app/utils/resend'

const DEFAULT_FROM = 'Spenpo <billing@spenpo.com>'

function authFromAddress() {
  return (
    process.env.AUTH_FROM_EMAIL || process.env.BILLING_FROM_EMAIL || DEFAULT_FROM
  )
}

export async function sendAuthVerificationRequest({
  identifier,
  url,
}: {
  identifier: string
  url: string
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }

  const { error } = await resend.emails.send({
    from: authFromAddress(),
    to: [identifier],
    subject: 'Your Spenpo sign-in link',
    ...(await renderEmail(
      <SignInMagicLink url={url} email={identifier} />
    )),
  })

  if (error) {
    console.log('auth magic link email failed', error.message)
    throw new Error(error.message)
  }
}
