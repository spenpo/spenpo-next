import { Stack, Typography } from '@mui/material'
import { formatMoney } from '@/app/utils/billing'

export function PriceBreakdown({
  subtotal,
  discountAmount,
  total,
  currency,
}: {
  subtotal: number
  discountAmount: number
  total: number
  currency: string
}) {
  return (
    <Stack gap={0.5}>
      <Stack direction="row" justifyContent="space-between">
        <Typography>Subtotal</Typography>
        <Typography>{formatMoney(subtotal, currency)}</Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography>Bank discount (2%)</Typography>
        <Typography>
          {discountAmount > 0
            ? `−${formatMoney(discountAmount, currency)}`
            : formatMoney(0, currency)}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography fontWeight={600}>Total</Typography>
        <Typography fontWeight={600}>{formatMoney(total, currency)}</Typography>
      </Stack>
    </Stack>
  )
}
