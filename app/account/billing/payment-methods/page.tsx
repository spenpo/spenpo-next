import { Stack, Typography } from '@mui/material'
import prisma from '@/app/utils/prisma'
import { getBillingCustomers } from '@/app/utils/stripeCustomer'
import {
  bankDiscountCents,
  formatMoney,
  listCustomerSubscriptions,
  subscriptionAnnualListAmount,
} from '@/app/utils/billing'
import { firstSearchParam } from '@/app/utils/billingAuth'
import { requireBillingPage } from '@/app/utils/billingSession'
import { PaymentMethodsManager } from '../components/PaymentMethodsManager'
import { BillingMismatchCard } from '../components/BillingMismatchCard'
import { PageProps } from '@/app/types/app'

export default async function PaymentMethodsPage({ searchParams }: PageProps) {
  const { session, billedEmail, mismatch } = await requireBillingPage(
    searchParams,
    '/account/billing/payment-methods'
  )

  if (mismatch) {
    return <BillingMismatchCard billedEmail={billedEmail!} />
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const billing = user?.email ? await getBillingCustomers(user) : null
  const subscriptions = billing
    ? await listCustomerSubscriptions(billing.customerIds)
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
