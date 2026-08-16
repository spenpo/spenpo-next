import { Typography } from '@mui/material'
import Link from 'next/link'
import React from 'react'
import { PageProps } from '@/app/types/app'
import { authSignInHref, firstSearchParam } from '@/app/utils/billingAuth'
import { AuthCard } from '../components/AuthCard'

export default function VerifyRequest({ searchParams }: PageProps) {
  const email = firstSearchParam(searchParams.email)
  const redirectTo = firstSearchParam(searchParams.redirect)
  const redisId = firstSearchParam(searchParams.redisId)
  const billedEmail = firstSearchParam(searchParams.billedEmail)
  const signInHref = authSignInHref({
    redirect: redirectTo,
    redisId,
    email: billedEmail,
  })

  return (
    <AuthCard>
      <Typography variant="h4" component="h1">
        Check your email
      </Typography>
      <Typography color="text.secondary">
        {email
          ? `We sent a sign-in link to ${email}.`
          : 'We sent a sign-in link to your email.'}
      </Typography>
      <Typography color="text.secondary">
        The link expires in 24 hours and can only be used once. Check spam if you do
        not see it.
      </Typography>
      <Typography
        component={Link}
        href={signInHref}
        sx={{ textDecoration: 'none' }}
      >
        Use a different email
      </Typography>
    </AuthCard>
  )
}
