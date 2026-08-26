'use client'
import React, { FormEvent, useEffect, useState } from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe, StripeError } from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import {
  isInFlightInvoicePayment,
  SerializedInvoice,
} from '@/app/utils/billing'
import { PriceBreakdown } from './PriceBreakdown'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

export function BankPaymentPending() {
  return (
    <Alert severity="info">
      Payment submitted. Bank transfers can take a few days to complete. This
      invoice will show as paid when the transfer clears.
    </Alert>
  )
}

function PayForm({
  invoice,
  clientSecret,
}: {
  invoice: SerializedInvoice
  clientSecret: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const finish = (status: string, paymentIntentId?: string) => {
    const query =
      status === 'processing' ? 'payment=processing' : 'payment=complete'
    const intent = paymentIntentId ? `&payment_intent=${paymentIntentId}` : ''
    router.push(`/account/billing/${invoice.id}?${query}${intent}`)
    router.refresh()
  }

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

    const confirmed =
      paymentIntent ??
      error?.payment_intent ??
      (await stripe.retrievePaymentIntent(clientSecret)).paymentIntent

    if (confirmed?.status === 'processing') {
      finish('processing', confirmed.id)
      return
    }

    if (
      confirmed?.status === 'succeeded' ||
      confirmed?.status === 'requires_capture'
    ) {
      finish('complete', confirmed.id)
      return
    }

    if (error) {
      setMessage(confirmErrorMessage(error))
      setIsLoading(false)
      return
    }

    setMessage('Payment is still pending. Refresh this page in a moment.')
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

function confirmErrorMessage(error: StripeError) {
  if (error.message && error.message !== 'A processing error occurred.') {
    return error.message
  }
  return 'Payment failed. Try another payment method or refresh this page.'
}

export function InvoicePayForm({ invoice }: { invoice: SerializedInvoice }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [customerSessionClientSecret, setCustomerSessionClientSecret] =
    useState<string | null>(null)
  const [payable, setPayable] = useState(invoice)
  const [message, setMessage] = useState<string | null>(null)
  const [paymentIntentStatus, setPaymentIntentStatus] = useState<string | null>(
    invoice.paymentIntentStatus
  )
  const [loadingSecret, setLoadingSecret] = useState(true)

  useEffect(() => {
    if (invoice.status !== 'open' && invoice.status !== 'draft') return
    if (isInFlightInvoicePayment(invoice.paymentIntentStatus)) {
      setPaymentIntentStatus(invoice.paymentIntentStatus)
      setLoadingSecret(false)
      return
    }

    let cancelled = false
    const load = async () => {
      const response = await fetch(`/api/billing/invoices/${invoice.id}/pay`, {
        method: 'POST',
      })
      const result = await response.json()
      if (cancelled) return
      if (!response.ok) {
        setMessage(result.error ?? 'Unable to start payment.')
        setLoadingSecret(false)
        return
      }
      setPayable(result.invoice)
      setPaymentIntentStatus(result.paymentIntentStatus ?? null)
      setClientSecret(result.clientSecret ?? null)
      setCustomerSessionClientSecret(result.customerSessionClientSecret ?? null)
      setLoadingSecret(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [invoice.id, invoice.status, invoice.paymentIntentStatus])

  if (loadingSecret) {
    return <Typography>Preparing payment...</Typography>
  }

  if (paymentIntentStatus === 'processing') {
    return <BankPaymentPending />
  }

  if (
    paymentIntentStatus === 'succeeded' ||
    paymentIntentStatus === 'requires_capture'
  ) {
    return (
      <Alert severity="success">
        Payment received. This invoice will update in a moment.
      </Alert>
    )
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
      <PayForm invoice={payable} clientSecret={clientSecret} />
    </Elements>
  )
}
