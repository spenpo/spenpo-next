import { getProviders } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { Stack, Typography, Divider } from '@mui/material'
import React from 'react'
import { PageProps } from '@/app/types/app'
import { redirect } from 'next/navigation'
import { ProviderBtn } from '../components/ProviderBtn'
import { EmailSignInForm } from '../components/EmailSignInForm'
import { MoreSignInOptions } from '../components/MoreSignInOptions'
import { authOptions } from '@/app/constants/api'
import { firstSearchParam, signInCallbackUrl } from '@/app/utils/billingAuth'

export default async function Signin({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const callbackUrl = signInCallbackUrl(searchParams)
  const billedEmail = firstSearchParam(searchParams.email)

  if (session) redirect(callbackUrl)

  const providers = await getProviders()
  const google = providers?.google
  const github = providers?.github

  return (
    <Stack gap={2} m="auto" textAlign="center" maxWidth="22em" width="100%">
      <Typography variant="h5">Welcome</Typography>
      {billedEmail && (
        <Typography color="text.secondary">
          Sign in as {billedEmail} to view this invoice.
        </Typography>
      )}
      <Divider flexItem />
      <EmailSignInForm callbackUrl={callbackUrl} defaultEmail={billedEmail} />
      {google && (
        <ProviderBtn
          id={google.id}
          name={google.name}
          callbackUrl={callbackUrl}
        />
      )}
      {github && (
        <MoreSignInOptions>
          <ProviderBtn
            id={github.id}
            name={github.name}
            callbackUrl={callbackUrl}
          />
        </MoreSignInOptions>
      )}
    </Stack>
  )
}
