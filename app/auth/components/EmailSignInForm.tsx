'use client'

import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { FormEvent, useState } from 'react'

export function EmailSignInForm({
  callbackUrl,
  defaultEmail,
}: {
  callbackUrl: string
  defaultEmail?: string
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

    router.push(`/auth/verify-request?email=${encodeURIComponent(email)}`)
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} gap={1.5} width="100%">
      <TextField
        type="email"
        name="email"
        label="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        autoComplete="email"
        size="small"
        fullWidth
      />
      <Button type="submit" variant="contained" disabled={loading || !email}>
        {loading ? 'Sending link...' : 'Email me a sign-in link'}
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
