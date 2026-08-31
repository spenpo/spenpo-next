import { redirect } from 'next/navigation'
import prisma from '@/app/utils/prisma'
import { getBillingCustomers } from '@/app/utils/stripeCustomer'
import { getOwnedSubscriptionDetail } from '@/app/utils/billing'
import { withEmailQuery } from '@/app/utils/billingAuth'
import { requireBillingPage } from '@/app/utils/billingSession'
import { SubscriptionManager } from '../../components/SubscriptionManager'
import { BillingMismatchCard } from '../../components/BillingMismatchCard'
import { PageProps } from '@/app/types/app'

export default async function SubscriptionDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { session, billedEmail, mismatch } = await requireBillingPage(
    searchParams,
    `/account/billing/subscriptions/${params.subscriptionId}`
  )
  if (mismatch) {
    return <BillingMismatchCard billedEmail={billedEmail!} />
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.email) {
    redirect(withEmailQuery('/account/billing/subscriptions', billedEmail))
  }

  const { customerIds } = await getBillingCustomers(user)
  const detail = await getOwnedSubscriptionDetail(customerIds, params.subscriptionId)
  if (!detail) {
    redirect(withEmailQuery('/account/billing/subscriptions', billedEmail))
  }

  return <SubscriptionManager initial={detail} />
}
