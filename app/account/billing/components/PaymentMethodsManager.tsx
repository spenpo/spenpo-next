'use client'
import React, { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LoadingButton from '@mui/lab/LoadingButton'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import {
  BillingAccountSummary,
  formatMoney,
  paymentMethodLabel,
  SerializedPaymentMethod,
} from '@/app/utils/billing'
import { BillingListSkeleton } from './BillingListSkeleton'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

function AddPaymentMethodForm({
  onSaved,
}: {
  onSaved: (paymentMethodId?: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!stripe || !elements) return
    setIsLoading(true)
    setMessage(null)

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account/billing/payment-methods`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message ?? 'Unable to save this payment method.')
      setIsLoading(false)
      return
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id

    setIsLoading(false)
    onSaved(paymentMethodId)
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} gap={2}>
      <PaymentElement />
      <LoadingButton
        type="submit"
        variant="contained"
        loading={isLoading}
        disabled={!stripe || isLoading}
      >
        Save payment method
      </LoadingButton>
      {message && <Box>{message}</Box>}
    </Stack>
  )
}

export function PaymentMethodsManager({
  setupIntentClientSecret,
}: {
  setupIntentClientSecret?: string
} = {}) {
  const [methods, setMethods] = useState<SerializedPaymentMethod[]>([])
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<
    string | null
  >(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bankPromptId, setBankPromptId] = useState<string | null>(null)
  const [postSaveBridge, setPostSaveBridge] = useState<{
    savedMethodId: string
    summary: BillingAccountSummary
  } | null>(null)
  const [settleSuccess, setSettleSuccess] = useState<string | null>(null)
  const [isSettling, setIsSettling] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<
    { type: 'add' } | { type: 'default' | 'remove'; id: string } | null
  >(null)

  const applyMethods = useCallback(
    async (
      nextMethods: SerializedPaymentMethod[],
      nextDefaultId: string | null,
      savedMethodId?: string
    ) => {
      let defaultId = nextDefaultId
      if (!defaultId && nextMethods.length === 1 && nextMethods[0]) {
        const setDefaultResponse = await fetch('/api/billing/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethodId: nextMethods[0].id }),
        })
        if (setDefaultResponse.ok) {
          defaultId = nextMethods[0].id
        }
      }

      setMethods(nextMethods)
      setDefaultPaymentMethodId(defaultId)

      const saved = savedMethodId
        ? nextMethods.find((method) => method.id === savedMethodId)
        : null
      if (
        saved?.type === 'us_bank_account' &&
        saved.id !== defaultId
      ) {
        setBankPromptId(saved.id)
      } else {
        setBankPromptId(null)
      }

      if (savedMethodId) {
        try {
          const summaryRes = await fetch('/api/billing/summary')
          if (summaryRes.ok) {
            const summary: BillingAccountSummary = await summaryRes.json()
            if (summary.hasUnsettledBalance || summary.hasDisabledAutopay) {
              setPostSaveBridge({
                savedMethodId,
                summary,
              })
            }
          }
        } catch (err) {
          console.error('Error fetching billing summary after save', err)
        }
      }
    },
    []
  )

  const loadMethods = useCallback(
    async (savedMethodId?: string) => {
      const response = await fetch('/api/billing/payment-methods')
      if (!response.ok) {
        setMessage('Unable to load payment methods.')
        setLoading(false)
        return
      }
      const data = await response.json()
      await applyMethods(
        data.methods,
        data.defaultPaymentMethodId,
        savedMethodId
      )
      setLoading(false)
    },
    [applyMethods]
  )

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      let savedMethodId: string | undefined
      if (setupIntentClientSecret) {
        const stripe = await stripePromise
        if (stripe) {
          const { setupIntent } = await stripe.retrieveSetupIntent(
            setupIntentClientSecret
          )
          if (
            setupIntent?.status === 'succeeded' ||
            setupIntent?.status === 'processing'
          ) {
            const paymentMethod = setupIntent.payment_method
            savedMethodId =
              typeof paymentMethod === 'string'
                ? paymentMethod
                : paymentMethod?.id
          }
        }
      }
      if (!cancelled) await loadMethods(savedMethodId)
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [loadMethods, setupIntentClientSecret])

  const startAdd = async () => {
    setPending({ type: 'add' })
    setMessage(null)
    const response = await fetch('/api/billing/setup-intent', { method: 'POST' })
    const data = await response.json()
    setPending(null)
    if (!response.ok) {
      setMessage(data.error ?? 'Unable to start adding a payment method.')
      return
    }
    setClientSecret(data.clientSecret)
  }

  const setDefault = async (paymentMethodId: string) => {
    setPending({ type: 'default', id: paymentMethodId })
    setMessage(null)
    const response = await fetch('/api/billing/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId }),
    })
    if (!response.ok) {
      setMessage('Unable to update the default payment method.')
      setPending(null)
      return
    }
    setBankPromptId(null)
    await loadMethods()
    setPending(null)
  }

  const remove = async (paymentMethodId: string) => {
    setPending({ type: 'remove', id: paymentMethodId })
    setMessage(null)
    const response = await fetch(
      `/api/billing/payment-methods?id=${paymentMethodId}`,
      { method: 'DELETE' }
    )
    if (!response.ok) {
      setMessage('Unable to remove this payment method.')
      setPending(null)
      return
    }
    setBankPromptId(null)
    await loadMethods()
    setPending(null)
  }

  const handleSettle = async (methodId: string) => {
    setIsSettling(true)
    setMessage(null)
    try {
      const response = await fetch('/api/billing/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: methodId,
          enableAutopay: true,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setMessage(
          data.error ??
            'Unable to process payment for open invoices. Please check your Invoices tab.'
        )
      } else {
        setPostSaveBridge(null)
        setSettleSuccess(
          'Payment received and autopay is now active! Your account is completely settled.'
        )
        await loadMethods()
      }
    } catch {
      setMessage('An error occurred while settling your account.')
    } finally {
      setIsSettling(false)
    }
  }

  if (loading) {
    return <BillingListSkeleton />
  }

  const bankPrompt = methods.find((method) => method.id === bankPromptId)
  const busy = Boolean(pending)

  return (
    <Stack gap={3}>
      {settleSuccess && (
        <Alert severity="success" onClose={() => setSettleSuccess(null)}>
          {settleSuccess}
        </Alert>
      )}

      {postSaveBridge && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: 2,
            borderColor: 'primary.main',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'background.paper' : 'action.hover',
          }}
        >
          <Stack gap={1.5}>
            <Stack direction="row" alignItems="center" gap={1}>
              <CheckCircleOutlineIcon color="success" />
              <Typography variant="subtitle1" fontWeight={600}>
                {paymentMethodLabel(
                  methods.find((m) => m.id === postSaveBridge.savedMethodId) ||
                    methods[0]
                )}{' '}
                saved!
              </Typography>
            </Stack>

            {postSaveBridge.summary.hasUnsettledBalance && (
              <Typography>
                You have{' '}
                <strong>
                  {postSaveBridge.summary.openInvoices.length +
                    postSaveBridge.summary.draftInvoices.length}{' '}
                  unpaid invoice(s)
                </strong>{' '}
                totaling{' '}
                <strong>
                  {formatMoney(
                    postSaveBridge.summary.totalAmountDue,
                    postSaveBridge.summary.currency
                  )}
                </strong>
                .
              </Typography>
            )}

            {postSaveBridge.summary.hasDisabledAutopay && (
              <Typography variant="body2" color="text.secondary">
                Autopay is currently turned off for your ongoing service.
              </Typography>
            )}

            <Stack
              direction="row"
              gap={2}
              alignItems="center"
              flexWrap="wrap"
              sx={{ mt: 0.5 }}
            >
              <LoadingButton
                variant="contained"
                loading={isSettling}
                onClick={() => handleSettle(postSaveBridge.savedMethodId)}
              >
                {postSaveBridge.summary.hasUnsettledBalance
                  ? `Pay ${formatMoney(
                      postSaveBridge.summary.totalAmountDue,
                      postSaveBridge.summary.currency
                    )} & Turn On Autopay`
                  : 'Turn On Autopay'}
              </LoadingButton>
              <Button
                variant="text"
                disabled={isSettling}
                onClick={() => setPostSaveBridge(null)}
              >
                I&apos;ll do this later
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {methods.length === 0 ? (
        <Typography color="text.secondary">
          Save a bank account or card to pay invoices and turn on autopay. Bank
          payments earn 2% off.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Method</TableCell>
              <TableCell>Default</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {methods.map((method) => (
              <TableRow key={method.id}>
                <TableCell>
                  {paymentMethodLabel(method)}
                  {method.type === 'us_bank_account' ? ' · 2% off' : ''}
                </TableCell>
                <TableCell>
                  {method.id === defaultPaymentMethodId ? (
                    <Chip size="small" color="success" label="Default" />
                  ) : (
                    <LoadingButton
                      size="small"
                      loading={
                        pending?.type === 'default' && pending.id === method.id
                      }
                      disabled={busy}
                      onClick={() => setDefault(method.id)}
                    >
                      Make default
                    </LoadingButton>
                  )}
                </TableCell>
                <TableCell align="right">
                  <LoadingButton
                    size="small"
                    color="error"
                    loading={
                      pending?.type === 'remove' && pending.id === method.id
                    }
                    disabled={busy}
                    onClick={() => remove(method.id)}
                  >
                    Remove
                  </LoadingButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {bankPrompt && (
        <Alert
          severity="info"
          action={
            <LoadingButton
              color="inherit"
              size="small"
              loading={pending?.type === 'default' && pending.id === bankPrompt.id}
              disabled={busy}
              onClick={() => setDefault(bankPrompt.id)}
            >
              Make default
            </LoadingButton>
          }
        >
          Make {paymentMethodLabel(bankPrompt)} your default to get 2% off the next
          invoice.
        </Alert>
      )}

      {clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: 'stripe' },
          }}
        >
          <AddPaymentMethodForm
            onSaved={(paymentMethodId) => {
              setClientSecret(null)
              loadMethods(paymentMethodId)
            }}
          />
        </Elements>
      ) : (
        <LoadingButton
          variant="outlined"
          loading={pending?.type === 'add'}
          disabled={busy}
          onClick={startAdd}
          sx={{ alignSelf: 'flex-start' }}
        >
          Add payment method
        </LoadingButton>
      )}
      {message && <Box>{message}</Box>}
    </Stack>
  )
}
