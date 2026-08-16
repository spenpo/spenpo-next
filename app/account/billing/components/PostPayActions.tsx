'use client'

import { useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  formatMoney,
  InvoicePostPayState,
  paymentMethodLabel,
} from '@/app/utils/billing'

export function PostPayActions({
  initial,
}: {
  initial: InvoicePostPayState
}) {
  const router = useRouter()
  const [state, setState] = useState(initial)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const paidMethodId = state.paidMethod?.id ?? null
  const defaultId = state.defaultPaymentMethodId
  const methodForAutopay = paidMethodId || defaultId
  const bankMethod = state.methods.find(
    (method) => method.type === 'us_bank_account'
  )
  const defaultMethod =
    state.methods.find((method) => method.id === defaultId) ?? null
  const usingBank =
    state.paidMethod?.type === 'us_bank_account' ||
    defaultMethod?.type === 'us_bank_account'
  const showSave = Boolean(paidMethodId) && paidMethodId !== defaultId
  const showAutopay = state.canEnableAutopay && Boolean(methodForAutopay)
  const showBank = !usingBank
  const savingsLabel =
    state.yearlyBankSavings > 0
      ? formatMoney(state.yearlyBankSavings, state.currency)
      : null

  const setDefaultMethod = async (paymentMethodId: string) => {
    const response = await fetch('/api/billing/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId }),
    })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      throw new Error(result.error ?? 'Unable to save this payment method.')
    }
  }

  const handleSave = async () => {
    if (!paidMethodId) return
    setSaving('save')
    setMessage(null)
    try {
      await setDefaultMethod(paidMethodId)
      setState((current) => ({
        ...current,
        defaultPaymentMethodId: paidMethodId,
        methods: current.paidMethod
          ? current.methods.some((method) => method.id === paidMethodId)
            ? current.methods
            : [...current.methods, current.paidMethod]
          : current.methods,
      }))
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to save this method.')
    }
    setSaving(null)
  }

  const handleAutopay = async () => {
    if (!state.subscriptionId || !methodForAutopay) return
    setSaving('autopay')
    setMessage(null)
    try {
      if (methodForAutopay !== defaultId) {
        await setDefaultMethod(methodForAutopay)
      }
      const response = await fetch(
        `/api/billing/subscriptions/${state.subscriptionId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'set_autopay',
            enabled: true,
            paymentMethodId: methodForAutopay,
          }),
        }
      )
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to turn on autopay.')
      }
      setState((current) => ({
        ...current,
        canEnableAutopay: false,
        defaultPaymentMethodId: methodForAutopay,
      }))
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to turn on autopay.')
    }
    setSaving(null)
  }

  const handleBank = async () => {
    if (!bankMethod) return
    setSaving('bank')
    setMessage(null)
    try {
      await setDefaultMethod(bankMethod.id)
      setState((current) => ({
        ...current,
        defaultPaymentMethodId: bankMethod.id,
      }))
      router.refresh()
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Unable to switch to bank payments.'
      )
    }
    setSaving(null)
  }

  return (
    <Stack gap={2}>
      <Typography color="success.main">Payment received. Thank you.</Typography>
      {(showSave || showAutopay || showBank) && (
        <Typography>
          A few optional next steps so the next invoice is easier.
        </Typography>
      )}
      {showSave && state.paidMethod && (
        <Button
          variant="contained"
          disabled={!!saving}
          onClick={handleSave}
          sx={{ alignSelf: 'flex-start' }}
        >
          {saving === 'save'
            ? '...saving'
            : `Save ${paymentMethodLabel(state.paidMethod)} for next time`}
        </Button>
      )}
      {showAutopay && (
        <Button
          variant="contained"
          disabled={!!saving}
          onClick={handleAutopay}
          sx={{ alignSelf: 'flex-start' }}
        >
          {saving === 'autopay' ? '...updating' : 'Turn on autopay'}
        </Button>
      )}
      {showBank &&
        (bankMethod ? (
          <Button
            variant="outlined"
            disabled={!!saving}
            onClick={handleBank}
            sx={{ alignSelf: 'flex-start' }}
          >
            {saving === 'bank'
              ? '...updating'
              : savingsLabel
                ? `Pay by bank next time and save ${savingsLabel}/year`
                : 'Pay by bank next time for 2% off'}
          </Button>
        ) : (
          <Button
            component={Link}
            href="/account/billing/payment-methods"
            variant="outlined"
            sx={{ alignSelf: 'flex-start' }}
          >
            {savingsLabel
              ? `Add a bank account to save ${savingsLabel}/year`
              : 'Add a bank account for 2% off'}
          </Button>
        ))}
      {message && <Box>{message}</Box>}
    </Stack>
  )
}
