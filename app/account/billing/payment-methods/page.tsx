import { Stack, Typography } from '@mui/material'
import prisma from '@/app/utils/prisma'
import { getOrCreateStripeCustomer } from '@/app/utils/stripeCustomer'
import {
  bankDiscountCents,
  formatMoney,
  listCustomerSubscriptions,
  subscriptionAnnualListAmount,
} from '@/app/utils/billing'
import { firstSearchParam } from '@/app/utils/billingAuth'
import { requireBillingPage } from '@/app/utils/billingSession'
import { PaymentMethodsManager } from '../components/PaymentMethodsManager'
import { PageProps } from '@/app/types/app'

export default async function PaymentMethodsPage({ searchParams }: PageProps) {
  const { session, mismatch } = await requireBillingPage(
    searchParams,
    '/account/billing/payment-methods'
  )

  if (mismatch) return null

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const customerId = user?.email ? await getOrCreateStripeCustomer(user) : null
  const subscriptions = customerId
    ? await listCustomerSubscriptions(customerId)
    : { current: [] }
  const annualList = subscriptions.current.reduce(
    (sum, subscription) => sum + subscriptionAnnualListAmount(subscription),
    0
  )
  const yearlySavings = bankDiscountCents(annualList)
  const currency = subscriptions.current[0]?.currency ?? 'usd'

  return (
    <Stack gap={2}>
      <Typography variant="body2" color="text.secondary">
        Bank payments earn 2% off every invoice. Cards pay list price. Changing your
        default method takes effect on the next invoice.
      </Typography>
      {yearlySavings > 0 && (
        <Typography>
          On your current subscriptions, paying by bank saves{' '}
          {formatMoney(yearlySavings, currency)}/year.
        </Typography>
      )}
      <PaymentMethodsManager
        setupIntentClientSecret={firstSearchParam(
          searchParams.setup_intent_client_secret
        )}
      />
    </Stack>
  )
}
