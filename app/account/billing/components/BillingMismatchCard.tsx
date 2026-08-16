import { Typography } from '@mui/material'
import React from 'react'

export function BillingMismatchCard({ billedEmail }: { billedEmail: string }) {
  return (
    <Typography color="text.secondary">
      This billing account belongs to {billedEmail}. Sign out and continue as that
      address to view invoices and set up autopay.
    </Typography>
  )
}
