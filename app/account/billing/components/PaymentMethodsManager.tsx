'use client'
import React, { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { SerializedPaymentMethod } from '@/app/utils/billing'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

function methodLabel(method: SerializedPaymentMethod) {
  if (method.type === 'card') {
    const brand = method.brand ? method.brand.toUpperCase() : 'Card'
    const exp =
      method.expMonth && method.expYear
        ? ` · ${method.expMonth}/${method.expYear}`
        : ''
    return `${brand} •••• ${method.last4 ?? ''}${exp}`
  }
  if (method.type === 'us_bank_account') {
    return `${method.bankName ?? 'Bank'} •••• ${method.last4 ?? ''}`
  }
  return method.type
}

function AddPaymentMethodForm({ onSaved }: { onSaved: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!stripe || !elements) return
    setIsLoading(true)
    setMessage(null)

    const { error } = await stripe.confirmSetup({
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

    setIsLoading(false)
    onSaved()
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} gap={2}>
      <PaymentElement />
      <Button type="submit" variant="contained" disabled={!stripe || isLoading}>
        {isLoading ? '...saving' : 'Save payment method'}
      </Button>
      {message && <Box>{message}</Box>}
    </Stack>
  )
}

export function PaymentMethodsManager() {
  const [methods, setMethods] = useState<SerializedPaymentMethod[]>([])
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<
    string | null
  >(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMethods = useCallback(async () => {
    const response = await fetch('/api/billing/payment-methods')
    if (!response.ok) {
      setMessage('Unable to load payment methods.')
      setLoading(false)
      return
    }
    const data = await response.json()
    setMethods(data.methods)
    setDefaultPaymentMethodId(data.defaultPaymentMethodId)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMethods()
  }, [loadMethods])

  const startAdd = async () => {
    const response = await fetch('/api/billing/setup-intent', { method: 'POST' })
    const data = await response.json()
    if (!response.ok) {
      setMessage(data.error ?? 'Unable to start adding a payment method.')
      return
    }
    setClientSecret(data.clientSecret)
  }

  const setDefault = async (paymentMethodId: string) => {
    const response = await fetch('/api/billing/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId }),
    })
    if (!response.ok) {
      setMessage('Unable to update the default payment method.')
      return
    }
    await loadMethods()
  }

  const remove = async (paymentMethodId: string) => {
    const response = await fetch(
      `/api/billing/payment-methods?id=${paymentMethodId}`,
      { method: 'DELETE' }
    )
    if (!response.ok) {
      setMessage('Unable to remove this payment method.')
      return
    }
    await loadMethods()
  }

  if (loading) {
    return <Typography>Loading payment methods...</Typography>
  }

  return (
    <Stack gap={3}>
      {methods.length === 0 ? (
        <Typography color="text.secondary">No payment methods saved yet.</Typography>
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
                <TableCell>{methodLabel(method)}</TableCell>
                <TableCell>
                  {method.id === defaultPaymentMethodId ? (
                    <Chip size="small" color="success" label="Default" />
                  ) : (
                    <Button size="small" onClick={() => setDefault(method.id)}>
                      Make default
                    </Button>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    onClick={() => remove(method.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
            onSaved={() => {
              setClientSecret(null)
              loadMethods()
            }}
          />
        </Elements>
      ) : (
        <Button
          variant="outlined"
          onClick={startAdd}
          sx={{ alignSelf: 'flex-start' }}
        >
          Add payment method
        </Button>
      )}
      {message && <Box>{message}</Box>}
    </Stack>
  )
}
