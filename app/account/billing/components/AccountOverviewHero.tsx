'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import LoadingButton from '@mui/lab/LoadingButton'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BillingAccountSummary,
  formatMoney,
  paymentMethodLabel,
} from '@/app/utils/billing'

export function AccountOverviewHero({
  summary: initialSummary,
}: {
  summary: BillingAccountSummary
}) {
  const router = useRouter()
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  const hasBalance = summary.hasUnsettledBalance
  const defaultMethod = summary.defaultPaymentMethod
  const hasSubs = summary.activeSubscriptions.length > 0
  const autopayOff = summary.hasDisabledAutopay

  const handleSettle = async (enableAutopay: boolean) => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/billing/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: defaultMethod?.id,
          enableAutopay,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setMessage({
          text:
            data.error ??
            'Unable to process payment automatically. Please review individual invoices below.',
          type: 'error',
        })
      } else {
        setMessage({
          text: enableAutopay
            ? 'Payment succeeded! Autopay is now active for future service.'
            : 'Payment succeeded! Your account balance is settled.',
          type: 'success',
        })
        const sumRes = await fetch('/api/billing/summary')
        if (sumRes.ok) {
          const nextSum = await sumRes.json()
          setSummary(nextSum)
        }
        router.refresh()
      }
    } catch {
      setMessage({
        text: 'An error occurred while processing payment.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnableAutopayOnly = async () => {
    if (!defaultMethod) return
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/billing/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: defaultMethod.id,
          enableAutopay: true,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage({
          text: data.error ?? 'Unable to enable autopay.',
          type: 'error',
        })
      } else {
        setMessage({
          text: 'Autopay is now active for future invoices!',
          type: 'success',
        })
        const sumRes = await fetch('/api/billing/summary')
        if (sumRes.ok) {
          setSummary(await sumRes.json())
        }
        router.refresh()
      }
    } catch {
      setMessage({
        text: 'An error occurred while enabling autopay.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        border: 2,
        borderColor: hasBalance
          ? 'warning.main'
          : autopayOff
            ? 'primary.main'
            : 'divider',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'background.paper'
            : hasBalance
              ? 'warning.50'
              : 'background.default',
        mb: 3,
      }}
    >
      <Stack gap={2}>
        {message && (
          <Alert
            severity={message.type}
            onClose={() => setMessage(null)}
            sx={{ mb: 1 }}
          >
            {message.text}
          </Alert>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={2}
        >
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700}>
              Account Balance
            </Typography>
            <Typography variant="h3" fontWeight={700}>
              {formatMoney(summary.totalAmountDue, summary.currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasBalance
                ? `${summary.openInvoices.length + summary.draftInvoices.length} invoice(s) waiting for payment`
                : 'All invoices paid in full'}
            </Typography>
          </Box>

          <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} gap={1}>
            {hasSubs && (
              <Stack direction="row" alignItems="center" gap={1}>
                {autopayOff ? (
                  <Chip
                    icon={<WarningAmberIcon />}
                    label="Autopay: Off"
                    color="warning"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<CheckCircleOutlineIcon />}
                    label="Autopay: On"
                    color="success"
                    size="small"
                  />
                )}
              </Stack>
            )}

            {defaultMethod && (
              <Typography variant="caption" color="text.secondary">
                Payment method: {paymentMethodLabel(defaultMethod)}
              </Typography>
            )}
          </Stack>
        </Stack>

        <Divider />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          gap={2}
        >
          {hasBalance ? (
            defaultMethod ? (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                gap={1.5}
                alignItems="center"
              >
                <LoadingButton
                  variant="contained"
                  size="large"
                  loading={loading}
                  onClick={() => handleSettle(autopayOff)}
                >
                  Pay {formatMoney(summary.totalAmountDue, summary.currency)} with{' '}
                  {paymentMethodLabel(defaultMethod)}
                  {autopayOff ? ' & Turn On Autopay' : ''}
                </LoadingButton>
              </Stack>
            ) : (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                gap={1.5}
                alignItems="center"
              >
                {summary.openInvoices[0] && (
                  <Button
                    component={Link}
                    href={`/account/billing/${summary.openInvoices[0].id}`}
                    variant="contained"
                    size="large"
                  >
                    Pay invoice now
                  </Button>
                )}
                <Button
                  component={Link}
                  href="/account/billing/payment-methods"
                  variant="outlined"
                  size="large"
                >
                  Save card for autopay
                </Button>
              </Stack>
            )
          ) : (
            <Stack direction="row" alignItems="center" gap={1}>
              <CheckCircleOutlineIcon color="success" />
              <Typography color="text.secondary">
                Your account is in good standing.
                {hasSubs && !autopayOff && ' Recurring service will charge automatically.'}
              </Typography>
            </Stack>
          )}

          {hasSubs && autopayOff && !hasBalance && defaultMethod && (
            <LoadingButton
              variant="outlined"
              loading={loading}
              onClick={handleEnableAutopayOnly}
            >
              Turn on autopay with {paymentMethodLabel(defaultMethod)}
            </LoadingButton>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}
