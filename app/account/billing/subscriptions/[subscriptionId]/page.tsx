import { redirect } from 'next/navigation'
import prisma from '@/app/utils/prisma'
import { getOrCreateStripeCustomer } from '@/app/utils/stripeCustomer'
import { getOwnedSubscriptionDetail } from '@/app/utils/billing'
import { withEmailQuery } from '@/app/utils/billingAuth'
import { requireBillingPage } from '@/app/utils/billingSession'
import { SubscriptionManager } from '../../components/SubscriptionManager'
import { PageProps } from '@/app/types/app'

export default async function SubscriptionDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { session, billedEmail, mismatch } = await requireBillingPage(
    searchParams,
    `/account/billing/subscriptions/${params.subscriptionId}`
  )
  if (mismatch) return null

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.email) {
    redirect(withEmailQuery('/account/billing/subscriptions', billedEmail))
  }

  const customerId = await getOrCreateStripeCustomer(user)
  const detail = await getOwnedSubscriptionDetail(customerId, params.subscriptionId)
  if (!detail) {
    redirect(withEmailQuery('/account/billing/subscriptions', billedEmail))
  }

  return <SubscriptionManager initial={detail} />
}
