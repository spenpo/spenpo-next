import { Typography } from '@mui/material'
import prisma from '@/app/utils/prisma'
import { getBillingCustomers } from '@/app/utils/stripeCustomer'
import { listCustomerSubscriptions } from '@/app/utils/billing'
import { requireBillingPage } from '@/app/utils/billingSession'
import { SubscriptionList } from '../components/SubscriptionList'
import { BillingMismatchCard } from '../components/BillingMismatchCard'
import { PageProps } from '@/app/types/app'

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const { session, billedEmail, mismatch } = await requireBillingPage(
    searchParams,
    '/account/billing/subscriptions'
  )

  if (mismatch) {
    return <BillingMismatchCard billedEmail={billedEmail!} />
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.email) {
    return (
      <Typography>
        Add an email address to your account to view subscriptions.
      </Typography>
    )
  }

  const { customerIds } = await getBillingCustomers(user)
  const { current, history } = await listCustomerSubscriptions(customerIds)

  return (
    <SubscriptionList
      current={current}
      history={history}
      sessionEmail={user.email}
      billedEmail={billedEmail}
    />
  )
}
