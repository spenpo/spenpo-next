import { Button, Typography } from '@mui/material'
import Link from 'next/link'
import { PageProps } from '@/app/types/app'
import { AuthCard } from '../components/AuthCard'
import { firstSearchParam } from '@/app/utils/billingAuth'

export default function AuthError({ searchParams }: PageProps) {
  const error = firstSearchParam(searchParams.error)
  const expired = error === 'Verification'

  return (
    <AuthCard>
      <Typography variant="h4" component="h1">
        {expired ? 'This link expired' : 'Unable to sign in'}
      </Typography>
      <Typography color="text.secondary">
        {expired
          ? 'Invoice sign-in links last 7 days and can only be used once. Request a new link to open billing.'
          : 'Something went wrong signing you in. Request a new sign-in link to continue.'}
      </Typography>
      <Button
        component={Link}
        href="/auth/signin?redirect=/account/billing"
        variant="contained"
        size="large"
      >
        Email me a new link
      </Button>
    </AuthCard>
  )
}
