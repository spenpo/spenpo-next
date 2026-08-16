import React, { Suspense } from 'react'
import { Paper, Stack, Typography } from '@mui/material'
import { BillingNav } from './components/BillingNav'
import { WrongAccountBanner } from './components/WrongAccountBanner'

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Stack
      p={{ xs: 2, sm: 5 }}
      mx="auto"
      maxWidth="50em"
      width="100%"
      flex={1}
      gap={3}
    >
      <Stack gap={1}>
        <Typography variant="h4" component="h1">
          Billing
        </Typography>
        <Typography color="text.secondary">
          Pay invoices, manage recurring billing, and save a card or bank for
          autopay.
        </Typography>
      </Stack>
      <Suspense fallback={null}>
        <WrongAccountBanner />
      </Suspense>
      <BillingNav />
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
          flex: 1,
        }}
      >
        {children}
      </Paper>
    </Stack>
  )
}
