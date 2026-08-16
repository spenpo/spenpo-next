import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/constants/api'
import {
  billingSignInUrl,
  emailsMatch,
  firstSearchParam,
  withEmailQuery,
} from '@/app/utils/billingAuth'

export async function requireBillingPage(
  searchParams: { [key: string]: string | string[] | undefined },
  returnPath: string
) {
  const billedEmail = firstSearchParam(searchParams.email) ?? null
  const returnWithEmail = withEmailQuery(returnPath, billedEmail)
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect(billingSignInUrl(returnWithEmail, billedEmail))
  }

  const mismatch = Boolean(
    billedEmail && !emailsMatch(session.user.email, billedEmail)
  )

  return { session, billedEmail, mismatch }
}
