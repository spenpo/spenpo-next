'use client'

import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { FormEvent, useState } from 'react'
import { authVerifyRequestHref } from '@/app/utils/billingAuth'

export function EmailSignInForm({
  callbackUrl,
  defaultEmail,
  redirect,
  redisId,
  billedEmail,
  invoiceContext,
}: {
  callbackUrl: string
  defaultEmail?: string
  redirect?: string
  redisId?: string
  billedEmail?: string
  invoiceContext?: boolean
}) {
  const router = useRouter()
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const result = await signIn('email', {
      email,
      callbackUrl,
      redirect: false,
    })

    if (result?.error) {
      setMessage('Unable to send a sign-in link. Try again.')
      setLoading(false)
      return
    }

    router.push(
      authVerifyRequestHref({
        email,
        redirect,
        redisId,
        billedEmail,
      })
    )
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} gap={2} width="100%">
      <TextField
        type="email"
        name="email"
        label="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        autoComplete="email"
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" disabled={loading || !email}>
        {loading
          ? 'Sending link...'
          : invoiceContext
            ? 'Email me a link to this invoice'
            : 'Email me a link'}
      </Button>
      {message && (
        <Box>
          <Typography color="error" variant="body2">
            {message}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}
