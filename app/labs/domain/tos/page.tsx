import React from 'react'
import { Box, Stack, Typography } from '@mui/material'

export default async function Tos() {
  return (
    <Stack m={{ xs: 2, sm: 5 }} justifyContent="space-between" flex={1}>
      <Stack rowGap={3}>
        <Typography component="h1">Terms of service</Typography>
        <Typography textAlign="right" fontStyle="italic">
          Last updated: February 14, 2024
        </Typography>
        <Box component="ul">
          <Typography component="li" />
        </Box>
      </Stack>
    </Stack>
  )
}
