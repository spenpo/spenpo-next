import { getProviders } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { Divider, Typography } from '@mui/material'
import React from 'react'
import { PageProps } from '@/app/types/app'
import { redirect } from 'next/navigation'
import { ProviderBtn } from '../components/ProviderBtn'
import { EmailSignInForm } from '../components/EmailSignInForm'
import { MoreSignInOptions } from '../components/MoreSignInOptions'
import { AuthCard } from '../components/AuthCard'
import { authOptions } from '@/app/constants/api'
import { firstSearchParam, signInCallbackUrl } from '@/app/utils/billingAuth'

export default async function Signin({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const callbackUrl = signInCallbackUrl(searchParams)
  const billedEmail = firstSearchParam(searchParams.email)
  const redirectTo = firstSearchParam(searchParams.redirect)
  const redisId = firstSearchParam(searchParams.redisId)

  if (session) redirect(callbackUrl)

  const providers = await getProviders()
  const google = providers?.google
  const github = providers?.github
  const invoiceContext = Boolean(billedEmail)

  return (
    <AuthCard>
      <Typography variant="h4" component="h1">
        {invoiceContext ? 'Open your invoice' : 'Sign up or sign in'}
      </Typography>
      <Typography color="text.secondary">
        {invoiceContext
          ? `Use ${billedEmail} so we can show the invoice we sent you. We'll email you a link — no password.`
          : "An account will be created if you're new."}
      </Typography>
      <EmailSignInForm
        callbackUrl={callbackUrl}
        defaultEmail={billedEmail}
        redirect={redirectTo}
        redisId={redisId}
        billedEmail={billedEmail}
        invoiceContext={invoiceContext}
      />
      {google && (
        <>
          <Divider flexItem>or</Divider>
          <ProviderBtn
            id={google.id}
            name={google.name}
            callbackUrl={callbackUrl}
          />
          {invoiceContext && (
            <Typography variant="body2" color="text.secondary">
              Only use Google if that account is {billedEmail}.
            </Typography>
          )}
        </>
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
    </AuthCard>
  )
}
