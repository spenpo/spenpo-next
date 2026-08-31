import { Typography } from '@mui/material'
import prisma from '@/app/utils/prisma'
import { getBillingCustomers } from '@/app/utils/stripeCustomer'
import { listCustomerInvoices } from '@/app/utils/billing'
import { requireBillingPage } from '@/app/utils/billingSession'
import { InvoiceList } from './components/InvoiceList'
import { BillingMismatchCard } from './components/BillingMismatchCard'
import { PageProps } from '@/app/types/app'

export default async function BillingPage({ searchParams }: PageProps) {
  const { session, billedEmail, mismatch } = await requireBillingPage(
    searchParams,
    '/account/billing'
  )

  if (mismatch) {
    return <BillingMismatchCard billedEmail={billedEmail!} />
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.email) {
    return (
      <Typography>
        Add an email address to your account to view invoices.
      </Typography>
    )
  }

  const { customerIds } = await getBillingCustomers(user)
  const { drafts, open, history } = await listCustomerInvoices(customerIds)

  return (
    <InvoiceList
      drafts={drafts}
      open={open}
      history={history}
      sessionEmail={user.email}
      billedEmail={billedEmail}
    />
  )
}
