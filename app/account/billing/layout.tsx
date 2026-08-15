import React from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Stack, Typography } from '@mui/material'
import { authOptions } from '@/app/constants/api'
import { BillingNav } from './components/BillingNav'

export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin?redirect=/account/billing')
  }

  return (
    <Stack m={{ xs: 2, sm: 5 }} rowGap={3} mx="auto" maxWidth="60em" width="100%">
      <Typography variant="h4" component="h1">
        Billing
      </Typography>
      <BillingNav />
      {children}
    </Stack>
  )
}
