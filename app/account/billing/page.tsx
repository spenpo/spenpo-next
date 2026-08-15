import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Typography } from '@mui/material'
import { authOptions } from '@/app/constants/api'
import prisma from '@/app/utils/prisma'
import { getOrCreateStripeCustomer } from '@/app/utils/stripeCustomer'
import { listCustomerInvoices } from '@/app/utils/billing'
import { InvoiceList } from './components/InvoiceList'

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/signin?redirect=/account/billing')
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.email) {
    return (
      <Typography>Add an email address to your account to view invoices.</Typography>
    )
  }

  const customerId = await getOrCreateStripeCustomer(user)
  const { open, history } = await listCustomerInvoices(customerId)

  return <InvoiceList open={open} history={history} />
}
