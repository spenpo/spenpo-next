import React, { Suspense } from 'react'
import { Stack, Typography } from '@mui/material'
import { BillingNav } from './components/BillingNav'
import { WrongAccountBanner } from './components/WrongAccountBanner'

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Stack m={{ xs: 2, sm: 5 }} rowGap={3} mx="auto" maxWidth="60em" width="100%">
      <Typography variant="h4" component="h1">
        Billing
      </Typography>
      <Suspense fallback={null}>
        <WrongAccountBanner />
      </Suspense>
      <BillingNav />
      {children}
    </Stack>
  )
}
