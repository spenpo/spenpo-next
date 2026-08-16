import { Stack, Typography } from '@mui/material'
import Link from 'next/link'
import React from 'react'
import { PageProps } from '@/app/types/app'
import { firstSearchParam } from '@/app/utils/billingAuth'

export default function VerifyRequest({ searchParams }: PageProps) {
  const email = firstSearchParam(searchParams.email)

  return (
    <Stack gap={2} m="auto" textAlign="center" maxWidth="28em" width="100%">
      <Typography variant="h5">Check your email</Typography>
      <Typography color="text.secondary">
        {email
          ? `We sent a sign-in link to ${email}.`
          : 'We sent a sign-in link to your email.'}
      </Typography>
      <Typography
        component={Link}
        href="/auth/signin"
        sx={{ textDecoration: 'none' }}
      >
        Use a different email
      </Typography>
    </Stack>
  )
}
