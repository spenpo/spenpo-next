'use client'

import { Alert, Button } from '@mui/material'
import { signOut, useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { billingSignInUrl, emailsMatch, withEmailQuery } from '@/app/utils/billingAuth'

export function WrongAccountBanner() {
  const { data: session } = useSession()
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const billedEmail = params.get('email')
  const sessionEmail = session?.user?.email

  if (!sessionEmail || !billedEmail || emailsMatch(sessionEmail, billedEmail)) {
    return null
  }

  const returnPath = withEmailQuery(pathname, billedEmail)

  return (
    <Alert
      severity="warning"
      action={
        <Button
          color="inherit"
          size="small"
          onClick={() =>
            signOut({ redirect: false }).then(() =>
              router.push(billingSignInUrl(returnPath, billedEmail))
            )
          }
        >
          Sign out and continue as {billedEmail}
        </Button>
      }
    >
      You&apos;re signed in as {sessionEmail}. This invoice was sent to {billedEmail}.
    </Alert>
  )
}
