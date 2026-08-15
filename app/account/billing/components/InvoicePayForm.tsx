'use client'
import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import { estimateInvoiceSurcharge, SerializedInvoice } from '@/app/utils/billing'
import { PriceBreakdown } from './PriceBreakdown'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

function PayForm({ invoice }: { invoice: SerializedInvoice }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [paymentMethodType, setPaymentMethodType] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const quote = useMemo(
    () => estimateInvoiceSurcharge(invoice.amountDue, paymentMethodType),
    [invoice.amountDue, paymentMethodType]
  )

  useEffect(() => {
    if (!elements) return
    elements.update({ amount: quote.total })
  }, [elements, quote.total])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setMessage(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setMessage(submitError.message ?? 'Check the payment form and try again.')
      setIsLoading(false)
      return
    }

    const { error: tokenError, confirmationToken } =
      await stripe.createConfirmationToken({
        elements,
        params: {
          return_url: `${window.location.origin}/account/billing/${invoice.id}?payment=complete`,
        },
      })

    if (tokenError || !confirmationToken) {
      setMessage(tokenError?.message ?? 'Unable to create a confirmation token.')
      setIsLoading(false)
      return
    }

    const response = await fetch(`/api/billing/invoices/${invoice.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmationTokenId: confirmationToken.id,
        returnUrl: `${window.location.origin}/account/billing/${invoice.id}?payment=complete`,
      }),
    })
    const result = await response.json()

    if (!response.ok) {
      setMessage(result.error ?? 'Payment failed.')
      setIsLoading(false)
      return
    }

    if (result.status === 'requires_action' && result.clientSecret) {
      const { error: actionError, paymentIntent } = await stripe.handleNextAction({
        clientSecret: result.clientSecret,
      })
      if (actionError) {
        setMessage(actionError.message ?? 'Additional authentication failed.')
        setIsLoading(false)
        return
      }
      if (paymentIntent?.status === 'succeeded') {
        router.push(`/account/billing/${invoice.id}?payment=complete`)
        router.refresh()
        return
      }
      if (paymentIntent?.status === 'processing') {
        setMessage(
          'Payment submitted. Bank transfers can take a few days to complete.'
        )
        setIsLoading(false)
        router.refresh()
        return
      }
    }

    if (result.status === 'succeeded') {
      router.push(`/account/billing/${invoice.id}?payment=complete`)
      router.refresh()
      return
    }

    if (result.status === 'processing') {
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
      <PaymentElement onChange={(event) => setPaymentMethodType(event.value.type)} />
      <PriceBreakdown
        amountDue={invoice.amountDue}
        surcharge={quote.surcharge}
        total={quote.total}
        currency={invoice.currency}
        estimated={quote.estimated}
      />
      <Typography variant="body2" color="text.secondary">
        Credit cards include a 3% processing fee. Debit cards and bank payments are
        charged the invoice amount. You can choose a different method after seeing
        the total.
      </Typography>
      <Button type="submit" variant="contained" disabled={!stripe || isLoading}>
        {isLoading ? '...processing' : 'Pay invoice'}
      </Button>
      {message && <Box>{message}</Box>}
    </Stack>
  )
}

export function InvoicePayForm({ invoice }: { invoice: SerializedInvoice }) {
  const options = {
    mode: 'payment' as const,
    amount: Math.max(invoice.amountDue, 50),
    currency: invoice.currency,
    appearance: { theme: 'stripe' as const },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PayForm invoice={invoice} />
    </Elements>
  )
}
