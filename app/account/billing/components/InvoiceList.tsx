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
import { bankAmount, formatMoney, SerializedInvoice } from '@/app/utils/billing'
import { emailsMatch } from '@/app/utils/billingAuth'

const STATUS_COLOR: Record<string, ChipProps['color']> = {
  draft: 'info',
  open: 'warning',
  paid: 'success',
  void: 'default',
  uncollectible: 'error',
}

function amountCell(invoice: SerializedInvoice) {
  if (invoice.status === 'draft') {
    return `${formatMoney(invoice.subtotal, invoice.currency)} card / ${formatMoney(
      bankAmount(invoice.subtotal),
      invoice.currency
    )} bank`
  }
  return formatMoney(invoice.amountDue, invoice.currency)
}

function InvoiceTable({
  invoices,
  emptyLabel,
  showPay,
}: {
  invoices: SerializedInvoice[]
  emptyLabel: string
  showPay?: boolean
}) {
  if (invoices.length === 0) {
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
          <TableCell>Invoice</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Amount</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id} hover>
            <TableCell>
              <Button
                component={Link}
                href={`/account/billing/${invoice.id}`}
                sx={{ textTransform: 'none', px: 0 }}
              >
                {invoice.number ||
                  (invoice.status === 'draft' ? 'Draft' : invoice.id)}
              </Button>
            </TableCell>
            <TableCell>
              {new Date(invoice.created * 1000).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Chip
                size="small"
                label={invoice.status ?? 'unknown'}
                color={STATUS_COLOR[invoice.status ?? ''] ?? 'default'}
              />
            </TableCell>
            <TableCell align="right">{amountCell(invoice)}</TableCell>
            <TableCell align="right">
              {showPay &&
                (invoice.status === 'open' || invoice.status === 'draft') &&
                invoice.subtotal > 0 && (
                  <Button
                    component={Link}
                    href={`/account/billing/${invoice.id}`}
                    variant="contained"
                    size="small"
                  >
                    Pay
                  </Button>
                )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function InvoiceList({
  drafts,
  open,
  history,
  sessionEmail,
  billedEmail,
}: {
  drafts: SerializedInvoice[]
  open: SerializedInvoice[]
  history: SerializedInvoice[]
  sessionEmail?: string
  billedEmail?: string | null
}) {
  if (drafts.length === 0 && open.length === 0 && history.length === 0) {
    return (
      <Stack gap={2} alignItems="flex-start">
        <Typography color="text.secondary">
          Invoices will show up here when we send them. You can add a bank or card
          now to turn on autopay.
        </Typography>
        {sessionEmail &&
          billedEmail &&
          !emailsMatch(sessionEmail, billedEmail) && (
            <Typography color="text.secondary">
              Invoices were sent to {billedEmail}. Sign in as that address to view
              them.
            </Typography>
          )}
        <Button
          component={Link}
          href="/account/billing/payment-methods"
          variant="contained"
        >
          Set up autopay
        </Button>
      </Stack>
    )
  }
  return (
    <Stack gap={4}>
      {drafts.length > 0 && (
        <Stack gap={1}>
          <Typography variant="h6">Ready to pay</Typography>
          <InvoiceTable
            invoices={drafts}
            emptyLabel="No invoices waiting on a payment method."
            showPay
          />
        </Stack>
      )}
      <Stack gap={1}>
        <Typography variant="h6">Open</Typography>
        <InvoiceTable
          invoices={open}
          emptyLabel="You have no open invoices."
          showPay
        />
      </Stack>
      <Stack gap={1}>
        <Typography variant="h6">History</Typography>
        <InvoiceTable invoices={history} emptyLabel="No past invoices yet." />
      </Stack>
    </Stack>
  )
}
