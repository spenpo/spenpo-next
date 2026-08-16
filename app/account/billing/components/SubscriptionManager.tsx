'use client'
import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  ChipProps,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  bankDiscountCents,
  formatMoney,
  paymentMethodLabel,
  periodsPerYear,
  SerializedPaymentMethod,
  SerializedSubscription,
  subscriptionListAmount,
} from '@/app/utils/billing'
import { DualPriceCopy } from './DualPriceCopy'

const STATUS_COLOR: Record<string, ChipProps['color']> = {
  active: 'success',
  trialing: 'info',
  past_due: 'warning',
  paused: 'default',
  incomplete: 'warning',
  unpaid: 'error',
  canceled: 'default',
  incomplete_expired: 'default',
}

function intervalLabel(item: SerializedSubscription['items'][number]) {
  if (!item.interval) return formatMoney(item.amount, item.currency)
  const count = item.intervalCount ?? 1
  const period = count === 1 ? item.interval : `${count} ${item.interval}s`
  return `${formatMoney(item.amount, item.currency)} / ${period}`
}

export function SubscriptionManager({
  initial,
}: {
  initial: {
    subscription: SerializedSubscription
    methods: SerializedPaymentMethod[]
  }
}) {
  const router = useRouter()
  const [subscription, setSubscription] = useState(initial.subscription)
  const [methods, setMethods] = useState(initial.methods)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const canManage =
    subscription.status !== 'canceled' &&
    subscription.status !== 'incomplete_expired'

  const selectedMethodId =
    subscription.defaultPaymentMethodId &&
    methods.some((method) => method.id === subscription.defaultPaymentMethodId)
      ? subscription.defaultPaymentMethodId
      : ''
  const selectedMethod =
    methods.find((method) => method.id === selectedMethodId) ?? null
  const bankMethod = methods.find((method) => method.type === 'us_bank_account')
  const listAmount = subscriptionListAmount(subscription)
  const yearlySavings = Math.round(
    bankDiscountCents(listAmount) *
      (periodsPerYear(
        subscription.items[0]?.interval ?? null,
        subscription.items[0]?.intervalCount ?? null
      ) || 1)
  )

  const applyDetail = (detail: {
    subscription: SerializedSubscription
    methods: SerializedPaymentMethod[]
  }) => {
    setSubscription(detail.subscription)
    setMethods(detail.methods)
    router.refresh()
  }

  const postAction = async (body: Record<string, unknown>) => {
    setSaving(true)
    setMessage(null)
    const response = await fetch(`/api/billing/subscriptions/${subscription.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    setSaving(false)
    if (!response.ok) {
      setMessage(data.error ?? 'Unable to update this subscription.')
      return false
    }
    applyDetail(data)
    return true
  }

  const handleAutopay = async (_event: unknown, enabled: boolean) => {
    if (enabled && methods.length === 0) {
      setMessage('Save a payment method before turning on autopay.')
      return
    }
    await postAction({
      action: 'set_autopay',
      enabled,
      paymentMethodId: subscription.defaultPaymentMethodId ?? methods[0]?.id,
    })
  }

  const handleSetPaymentMethod = async (paymentMethodId: string) => {
    if (
      !window.confirm(
        'This changes the rate on your next invoice, not the current period. Continue?'
      )
    ) {
      return
    }
    await postAction({
      action: 'set_payment_method',
      paymentMethodId,
    })
  }

  const handleCancel = async () => {
    if (
      !window.confirm(
        'Cancel this subscription at the end of the current billing period?'
      )
    ) {
      return
    }
    await postAction({ action: 'cancel' })
  }

  return (
    <Stack gap={3}>
      <Button
        component={Link}
        href="/account/billing/subscriptions"
        sx={{ alignSelf: 'flex-start', px: 0 }}
      >
        Back to subscriptions
      </Button>
      <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
        <Typography variant="h5">
          {subscription.items[0]?.productName ||
            subscription.description ||
            subscription.id}
        </Typography>
        <Chip
          size="small"
          label={
            subscription.cancelAtPeriodEnd
              ? 'cancels at period end'
              : subscription.status
          }
          color={
            subscription.cancelAtPeriodEnd
              ? 'warning'
              : STATUS_COLOR[subscription.status] ?? 'default'
          }
        />
      </Stack>
      {subscription.description && subscription.items[0] && (
        <Typography color="text.secondary">{subscription.description}</Typography>
      )}
      <Stack gap={0.5}>
        {subscription.items.map((item) => (
          <Typography key={item.id}>
            {item.productName} · {intervalLabel(item)}
          </Typography>
        ))}
        {subscription.currentPeriodEnd && (
          <Typography color="text.secondary">
            Current period ends{' '}
            {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}
          </Typography>
        )}
      </Stack>
      <DualPriceCopy
        listAmount={listAmount}
        currency={subscription.currency}
        interval={subscription.items[0]?.interval ?? null}
        intervalCount={subscription.items[0]?.intervalCount ?? null}
        currentMethod={selectedMethod}
      />
      {canManage &&
        bankMethod &&
        selectedMethod?.type !== 'us_bank_account' &&
        yearlySavings > 0 && (
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => handleSetPaymentMethod(bankMethod.id)}
            sx={{ alignSelf: 'flex-start' }}
          >
            Switch to bank and save{' '}
            {formatMoney(yearlySavings, subscription.currency)}/year
          </Button>
        )}

      {subscription.openInvoiceId &&
        (subscription.openInvoiceAmountDue ?? 0) > 0 && (
          <Stack gap={1}>
            <Typography>
              There is an invoice for{' '}
              {formatMoney(
                subscription.openInvoiceAmountDue ?? 0,
                subscription.currency
              )}
              . Autopay applies to future invoices only. This invoice was issued at
              the rate in effect when it was created.
            </Typography>
            <Button
              component={Link}
              href={`/account/billing/${subscription.openInvoiceId}`}
              variant="contained"
              sx={{ alignSelf: 'flex-start' }}
            >
              Pay current invoice
            </Button>
          </Stack>
        )}

      {canManage && (
        <>
          <FormControlLabel
            control={
              <Switch
                checked={subscription.autopay}
                onChange={handleAutopay}
                disabled={saving}
              />
            }
            label="Autopay future invoices"
          />
          <Typography variant="body2" color="text.secondary">
            Autopay charges your saved method for future invoices. Turning it on or
            changing methods does not reprice the current period.
          </Typography>

          {methods.length === 0 ? (
            <Typography>
              No payment methods saved.{' '}
              <Button
                component={Link}
                href="/account/billing/payment-methods"
                sx={{ textTransform: 'none', px: 0.5 }}
              >
                Add a payment method
              </Button>
            </Typography>
          ) : (
            <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel id="subscription-payment-method">
                  Payment method
                </InputLabel>
                <Select
                  labelId="subscription-payment-method"
                  label="Payment method"
                  value={selectedMethodId}
                  disabled={saving}
                  onChange={(event) => {
                    if (!event.target.value) return
                    handleSetPaymentMethod(event.target.value)
                  }}
                >
                  <MenuItem value="">
                    <em>Select a payment method</em>
                  </MenuItem>
                  {methods.map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      {paymentMethodLabel(method)}
                      {method.type === 'us_bank_account' ? ' · 2% off' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                component={Link}
                href="/account/billing/payment-methods"
                sx={{ textTransform: 'none' }}
              >
                Manage methods
              </Button>
            </Stack>
          )}

          {subscription.cancelAtPeriodEnd ? (
            <Button
              variant="outlined"
              disabled={saving}
              onClick={() => postAction({ action: 'resume' })}
              sx={{ alignSelf: 'flex-start' }}
            >
              Undo cancel
            </Button>
          ) : (
            <Button
              color="error"
              variant="outlined"
              disabled={saving}
              onClick={handleCancel}
              sx={{ alignSelf: 'flex-start' }}
            >
              Cancel at period end
            </Button>
          )}
        </>
      )}

      {message && <Box>{message}</Box>}
    </Stack>
  )
}
