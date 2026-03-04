import React, { Suspense } from 'react'
import { ContactForm } from './components/ContactForm'
import { Stack, Typography } from '@mui/material'

export default function Home() {
  return (
    <Stack
      p={{ xs: 2, sm: 5 }}
      gap={5}
      maxWidth="50em"
      mx="auto"
      flex={1}
      width="100%"
    >
      <Typography component="h1">Contact</Typography>
      <Suspense fallback={null}>
        <ContactForm />
      </Suspense>
    </Stack>
  )
}
