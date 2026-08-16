'use client'
import React, { FormEvent, useCallback, useEffect, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import { bankAmount, formatMoney, SerializedInvoice } from '@/app/utils/billing'
import { PriceBreakdown } from './PriceBreakdown'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

function PayForm({ invoice }: { invoice: SerializedInvoice }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account/billing/${invoice.id}?payment=complete`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message ?? 'Payment failed.')
      setIsLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      router.push(
        `/account/billing/${invoice.id}?payment=complete&payment_intent=${paymentIntent.id}`
      )
      router.refresh()
      return
    }

    if (paymentIntent?.status === 'processing') {
      setMessage(
        'Payment submitted. Bank transfers can take a few days to complete.'
      )
      router.refresh()
    } else {
      setMessage('Payment is still pending. Refresh this page in a moment.')
    }
    setIsLoading(false)
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} gap={2}>
      <PaymentElement />
      <PriceBreakdown
        subtotal={invoice.subtotal}
        discountAmount={invoice.discountAmount}
        total={invoice.amountDue}
        currency={invoice.currency}
      />
      {invoice.discountAmount === 0 && (
        <Typography variant="body2" color="text.secondary">
          This invoice was issued at the card price. Bank payments save 2% on the
          next invoice.
        </Typography>
      )}
      <Button type="submit" variant="contained" disabled={!stripe || isLoading}>
        {isLoading ? '...processing' : 'Pay invoice'}
      </Button>
      {message && <Box>{message}</Box>}
    </Stack>
  )
}

type PayReady = {
  clientSecret: string
  customerSessionClientSecret: string | null
  invoice: SerializedInvoice
}

function DraftPriceChoice({
  invoice,
  onReady,
}: {
  invoice: SerializedInvoice
  onReady: (ready: PayReady) => void
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<'card' | 'us_bank_account' | null>(null)
  const cardTotal = invoice.subtotal
  const bankTotal = bankAmount(invoice.subtotal)

  const choose = async (paymentMethodType: 'card' | 'us_bank_account') => {
    setIsLoading(paymentMethodType)
    setMessage(null)
    const response = await fetch(`/api/billing/invoices/${invoice.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodType }),
    })
    const result = await response.json()
    if (!response.ok) {
      setMessage(result.error ?? 'Unable to start payment.')
      setIsLoading(null)
      return
    }
    onReady({
      clientSecret: result.clientSecret,
      customerSessionClientSecret: result.customerSessionClientSecret ?? null,
      invoice: result.invoice,
    })
  }

  return (
    <Stack gap={2}>
      <Typography>
        This invoice is ready to pay — {formatMoney(cardTotal, invoice.currency)} by
        card, or {formatMoney(bankTotal, invoice.currency)} by bank. Choose a method
        to lock in that price, then complete payment.
      </Typography>
      <Stack direction="row" gap={2} flexWrap="wrap">
        <Button
          variant="contained"
          disabled={!!isLoading}
          onClick={() => choose('card')}
        >
          {isLoading === 'card'
            ? '...preparing'
            : `Pay ${formatMoney(cardTotal, invoice.currency)} by card`}
        </Button>
        <Button
          variant="outlined"
          disabled={!!isLoading}
          onClick={() => choose('us_bank_account')}
        >
          {isLoading === 'us_bank_account'
            ? '...preparing'
            : `Pay ${formatMoney(bankTotal, invoice.currency)} by bank`}
        </Button>
      </Stack>
      {message && <Box>{message}</Box>}
    </Stack>
  )
}

export function InvoicePayForm({ invoice }: { invoice: SerializedInvoice }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [customerSessionClientSecret, setCustomerSessionClientSecret] =
    useState<string | null>(null)
  const [payable, setPayable] = useState(invoice)
  const [message, setMessage] = useState<string | null>(null)
  const [loadingSecret, setLoadingSecret] = useState(invoice.status === 'open')

  const applyReady = useCallback((ready: PayReady) => {
    setPayable(ready.invoice)
    setClientSecret(ready.clientSecret)
    setCustomerSessionClientSecret(ready.customerSessionClientSecret)
  }, [])

  useEffect(() => {
    if (invoice.status !== 'open') return

    let cancelled = false
    const load = async () => {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const result = await response.json()
      if (cancelled) return
      if (!response.ok) {
        setMessage(result.error ?? 'Unable to start payment.')
        setLoadingSecret(false)
        return
      }
      applyReady({
        clientSecret: result.clientSecret,
        customerSessionClientSecret: result.customerSessionClientSecret ?? null,
        invoice: result.invoice,
      })
      setLoadingSecret(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [applyReady, invoice.id, invoice.status])

  if (invoice.status === 'draft' && !clientSecret) {
    return <DraftPriceChoice invoice={invoice} onReady={applyReady} />
  }

  if (loadingSecret) {
    return <Typography>Preparing payment...</Typography>
  }

  if (!clientSecret) {
    return message ? <Box>{message}</Box> : null
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' },
        ...(customerSessionClientSecret ? { customerSessionClientSecret } : {}),
      }}
    >
      <PayForm invoice={payable} />
    </Elements>
  )
}
