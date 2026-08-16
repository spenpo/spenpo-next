import {
  Button,
  Chip,
  ChipProps,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import { formatMoney, SerializedSubscription } from '@/app/utils/billing'
import { emailsMatch } from '@/app/utils/billingAuth'
import { subscriptionStatusLabel } from './statusLabels'

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

function subscriptionTitle(subscription: SerializedSubscription) {
  if (subscription.items[0]) {
    return subscription.items.map((item) => item.productName).join(', ')
  }
  return subscription.description || subscription.id
}

function SubscriptionTable({
  subscriptions,
  emptyLabel,
}: {
  subscriptions: SerializedSubscription[]
  emptyLabel: string
}) {
  if (subscriptions.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        {emptyLabel}
      </Typography>
    )
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Subscription</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Billing</TableCell>
          <TableCell>Period end</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {subscriptions.map((subscription) => (
          <TableRow key={subscription.id} hover>
            <TableCell>
              <Button
                component={Link}
                href={`/account/billing/subscriptions/${subscription.id}`}
                sx={{ textTransform: 'none', px: 0 }}
              >
                {subscriptionTitle(subscription)}
              </Button>
            </TableCell>
            <TableCell>
              <Chip
                size="small"
                label={subscriptionStatusLabel(
                  subscription.status,
                  subscription.cancelAtPeriodEnd
                )}
                color={
                  subscription.cancelAtPeriodEnd
                    ? 'warning'
                    : STATUS_COLOR[subscription.status] ?? 'default'
                }
              />
            </TableCell>
            <TableCell>
              {subscription.items[0]
                ? intervalLabel(subscription.items[0])
                : formatMoney(0, subscription.currency)}
              {subscription.autopay ? ' · Autopay' : ''}
            </TableCell>
            <TableCell>
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()
                : '—'}
            </TableCell>
            <TableCell align="right">
              {subscription.openInvoiceId &&
                (subscription.openInvoiceAmountDue ?? 0) > 0 && (
                  <Button
                    component={Link}
                    href={`/account/billing/${subscription.openInvoiceId}`}
                    variant="contained"
                    size="small"
                  >
                    Pay invoice
                  </Button>
                )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function SubscriptionList({
  current,
  history,
  sessionEmail,
  billedEmail,
}: {
  current: SerializedSubscription[]
  history: SerializedSubscription[]
  sessionEmail?: string
  billedEmail?: string | null
}) {
  if (current.length === 0 && history.length === 0) {
    return (
      <Stack gap={2} alignItems="flex-start">
        <Typography color="text.secondary">
          Recurring billing will show up here when a subscription is set up.
        </Typography>
        {sessionEmail &&
          billedEmail &&
          !emailsMatch(sessionEmail, billedEmail) && (
            <Typography color="text.secondary">
              Billing for {billedEmail} is on a different account. Sign in as that
              address to manage it.
            </Typography>
          )}
      </Stack>
    )
  }
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Typography variant="h6">Current</Typography>
        <SubscriptionTable
          subscriptions={current}
          emptyLabel="You have no subscriptions."
        />
      </Stack>
      <Stack gap={1}>
        <Typography variant="h6">History</Typography>
        <SubscriptionTable
          subscriptions={history}
          emptyLabel="No past subscriptions yet."
        />
      </Stack>
    </Stack>
  )
}
