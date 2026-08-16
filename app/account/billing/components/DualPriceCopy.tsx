import { Typography } from '@mui/material'
import {
  bankAmount,
  bankDiscountCents,
  formatMoney,
  paymentMethodLabel,
  periodsPerYear,
  SerializedPaymentMethod,
} from '@/app/utils/billing'

function cadenceLabel(interval: string | null, intervalCount: number | null) {
  if (!interval) return null
  const count = intervalCount ?? 1
  if (interval === 'month' && count === 1) return 'mo'
  if (interval === 'year' && count === 1) return 'yr'
  return count === 1 ? interval : `${count} ${interval}s`
}

function rateLabel(
  amount: number,
  currency: string,
  interval: string | null,
  intervalCount: number | null
) {
  const cadence = cadenceLabel(interval, intervalCount)
  if (!cadence) return formatMoney(amount, currency)
  return `${formatMoney(amount, currency)}/${cadence}`
}

export function DualPriceCopy({
  listAmount,
  currency,
  interval,
  intervalCount,
  currentMethod,
}: {
  listAmount: number
  currency: string
  interval: string | null
  intervalCount: number | null
  currentMethod: SerializedPaymentMethod | null
}) {
  if (listAmount <= 0) return null

  const cardRate = rateLabel(listAmount, currency, interval, intervalCount)
  const bankRate = rateLabel(
    bankAmount(listAmount),
    currency,
    interval,
    intervalCount
  )
  const periods = periodsPerYear(interval, intervalCount)
  const yearlySavings = Math.round(bankDiscountCents(listAmount) * (periods || 1))
  const savingsLabel = formatMoney(yearlySavings, currency)
  const savingsPhrase =
    periods > 0 ? `saving ${savingsLabel}/year` : `saving ${savingsLabel}`

  if (currentMethod?.type === 'us_bank_account') {
    return (
      <Typography>
        <strong>Your rate</strong> is {bankRate} on{' '}
        {paymentMethodLabel(currentMethod)} — you&apos;re {savingsPhrase} versus card
        ({cardRate}). Method changes apply to the next invoice.
      </Typography>
    )
  }

  if (currentMethod?.type === 'card') {
    return (
      <Typography>
        <strong>Your rate</strong> is {cardRate} on{' '}
        {paymentMethodLabel(currentMethod)} — pay by bank for {bankRate},{' '}
        {savingsPhrase}. Method changes apply to the next invoice.
      </Typography>
    )
  }

  return (
    <Typography>
      List price is {cardRate} by card. Pay by bank for {bankRate}, {savingsPhrase}.
      Save a bank account to apply the discount on the next invoice.
    </Typography>
  )
}
