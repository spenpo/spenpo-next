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
import { formatMoney, SerializedInvoice } from '@/app/utils/billing'

const STATUS_COLOR: Record<string, ChipProps['color']> = {
  open: 'warning',
  paid: 'success',
  void: 'default',
  uncollectible: 'error',
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
                {invoice.number || invoice.id}
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
            <TableCell align="right">
              {formatMoney(invoice.amountDue, invoice.currency)}
            </TableCell>
            <TableCell align="right">
              {showPay && invoice.status === 'open' && invoice.amountDue > 0 && (
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
  open,
  history,
}: {
  open: SerializedInvoice[]
  history: SerializedInvoice[]
}) {
  return (
    <Stack gap={4}>
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
