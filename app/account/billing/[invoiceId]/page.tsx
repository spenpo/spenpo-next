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
import prisma from '@/app/utils/prisma'
import { getOrCreateStripeCustomer } from '@/app/utils/stripeCustomer'
import { formatMoney, getInvoicePostPayState, getOwnedInvoice, serializeInvoice } from '@/app/utils/billing'
import { withEmailQuery, firstSearchParam } from '@/app/utils/billingAuth'
import { requireBillingPage } from '@/app/utils/billingSession'
import { InvoicePayForm } from '../components/InvoicePayForm'
import { PostPayActions } from '../components/PostPayActions'
import { PageProps } from '@/app/types/app'

const STATUS_COLOR: Record<string, ChipProps['color']> = {
  draft: 'info',
  open: 'warning',
  paid: 'success',
  void: 'default',
  uncollectible: 'error',
}

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { session, billedEmail, mismatch } = await requireBillingPage(
    searchParams,
    `/account/billing/${params.invoiceId}`
  )
  if (mismatch) return null

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.email) {
    redirect(withEmailQuery('/account/billing', billedEmail))
  }

  const customerId = await getOrCreateStripeCustomer(user)
  const invoice = await getOwnedInvoice(customerId, params.invoiceId)
  if (!invoice) {
    redirect(withEmailQuery('/account/billing', billedEmail))
  }

  const serialized = serializeInvoice(invoice)
  const paymentComplete = firstSearchParam(searchParams.payment) === 'complete'
  const paymentIntentId = firstSearchParam(searchParams.payment_intent)
  const postPay =
    paymentComplete && serialized.status === 'paid'
      ? await getInvoicePostPayState(customerId, invoice, paymentIntentId)
      : null

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
            <TableCell>Subtotal</TableCell>
            <TableCell align="right">
              {formatMoney(serialized.subtotal, serialized.currency)}
            </TableCell>
          </TableRow>
          {serialized.discountAmount > 0 && (
            <TableRow>
              <TableCell>Bank discount (2%)</TableCell>
              <TableCell align="right">
                −{formatMoney(serialized.discountAmount, serialized.currency)}
              </TableCell>
            </TableRow>
          )}
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
      {postPay && <PostPayActions initial={postPay} />}
      {serialized.status === 'open' && serialized.amountDue > 0 && (
        <>
          <Typography variant="body2" color="text.secondary">
            This invoice was finalized at the rate in effect when it was issued.
          </Typography>
          <InvoicePayForm invoice={serialized} />
        </>
      )}
      {serialized.status === 'draft' && serialized.subtotal > 0 && (
        <InvoicePayForm invoice={serialized} />
      )}
    </Stack>
  )
}
