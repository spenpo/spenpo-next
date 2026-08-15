import { Stack, Typography } from '@mui/material'
import { formatMoney } from '@/app/utils/billing'

export function PriceBreakdown({
  amountDue,
  surcharge,
  total,
  currency,
  estimated,
}: {
  amountDue: number
  surcharge: number
  total: number
  currency: string
  estimated?: boolean
}) {
  return (
    <Stack gap={0.5}>
      <Stack direction="row" justifyContent="space-between">
        <Typography>Invoice</Typography>
        <Typography>{formatMoney(amountDue, currency)}</Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography>
          Card processing fee (3%){estimated ? ' (estimated)' : ''}
        </Typography>
        <Typography>{formatMoney(surcharge, currency)}</Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography fontWeight={600}>Total</Typography>
        <Typography fontWeight={600}>{formatMoney(total, currency)}</Typography>
      </Stack>
    </Stack>
  )
}
