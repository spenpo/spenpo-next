import React from 'react'
import { Stack, Typography } from '@mui/material'
import { Stepper } from '@/app/products/landing-page/components/Stepper'
import redis from '@/app/utils/redis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/constants/api'
import { redirect } from 'next/navigation'
import { CheckoutBtn } from '@/app/products/landing-page/password/components/CheckoutBtn'
import { PasswordForm } from '@/app/products/landing-page/password/components/PasswordForm'

export default async function Password() {
  const session = await getServerSession(authOptions)

  let cache: Record<string, string> = {}

  if (session?.user.id) cache = await redis.hgetall(session.user.id)

  if (cache.HEADSHOT_FILE && session?.user.id)
    await redis.expire(session.user.id, 300)
  else redirect('/labs/landing-page/design')

  return (
    <Stack gap={5} flex={1} justifyContent="flex-start" m={{ xs: 2, sm: 5 }}>
      <Stack>
        <Stepper activeStep={2} />
      </Stack>
      <Stack
        justifyContent="space-between"
        direction={{ xs: 'column', sm: 'row' }}
        gap={1}
      >
        <Typography variant="h5">
          Choose a secure password for accessing admin features on your site
        </Typography>
        <CheckoutBtn />
      </Stack>
      <Stack flex={1} justifyContent="flex-start" gap={1} alignItems="center">
        <PasswordForm />
      </Stack>
    </Stack>
  )
}
