import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
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
import { authOptions } from '@/app/constants/api'
import prisma from '@/app/utils/prisma'
import { getOrCreateStripeCustomer } from '@/app/utils/stripeCustomer'
import { formatMoney, getOwnedInvoice, serializeInvoice } from '@/app/utils/billing'
import { InvoicePayForm } from '../components/InvoicePayForm'
import { PageProps } from '@/app/types/app'

const STATUS_COLOR: Record<string, ChipProps['color']> = {
  open: 'warning',
  paid: 'success',
  void: 'default',
  uncollectible: 'error',
}

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/auth/signin?redirect=/account/billing/${params.invoiceId}`)
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.email) {
    redirect('/account/billing')
  }

  const customerId = await getOrCreateStripeCustomer(user)
  const invoice = await getOwnedInvoice(customerId, params.invoiceId)
  if (!invoice) {
    redirect('/account/billing')
  }

  const serialized = serializeInvoice(invoice)
  const paymentComplete = searchParams.payment === 'complete'

  return (
    <Stack gap={3}>
      <Button
        component={Link}
        href="/account/billing"
        sx={{ alignSelf: 'flex-start', px: 0 }}
      >
        Back to invoices
      </Button>
      <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
        <Typography variant="h5">{serialized.number || serialized.id}</Typography>
        <Chip
          size="small"
          label={serialized.status ?? 'unknown'}
          color={STATUS_COLOR[serialized.status ?? ''] ?? 'default'}
        />
      </Stack>
      {serialized.description && (
        <Typography color="text.secondary">{serialized.description}</Typography>
      )}
      <Stack direction="row" gap={2} flexWrap="wrap">
        {serialized.hostedInvoiceUrl && (
          <Button
            href={serialized.hostedInvoiceUrl}
            target="_blank"
            rel="noreferrer"
            variant="outlined"
          >
            View hosted invoice
          </Button>
        )}
        {serialized.invoicePdf && (
          <Button
            href={serialized.invoicePdf}
            target="_blank"
            rel="noreferrer"
            variant="outlined"
          >
            Download PDF
          </Button>
        )}
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {serialized.lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>{line.description || 'Line item'}</TableCell>
              <TableCell align="right">
                {formatMoney(line.amount, serialized.currency)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>
              <Typography fontWeight={600}>Amount due</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography fontWeight={600}>
                {formatMoney(serialized.amountDue, serialized.currency)}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {paymentComplete && serialized.status === 'paid' && (
        <Typography color="success.main">Payment received. Thank you.</Typography>
      )}
      {serialized.status === 'open' && serialized.amountDue > 0 && (
        <InvoicePayForm invoice={serialized} />
      )}
    </Stack>
  )
}
