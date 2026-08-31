import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/constants/api'
import prisma from '@/app/utils/prisma'
import { getBillingCustomers } from '@/app/utils/stripeCustomer'
import {
  billingSignInUrl,
  emailsMatch,
  firstSearchParam,
  withEmailQuery,
} from '@/app/utils/billingAuth'

export async function requireBillingContext() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.email) {
    return {
      error: NextResponse.json(
        { error: 'An email address is required for billing' },
        { status: 400 }
      ),
    }
  }

  const { customerId, customerIds } = await getBillingCustomers(user)
  return { user, customerId, customerIds, session }
}

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
