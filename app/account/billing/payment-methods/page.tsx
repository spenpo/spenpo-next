import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Typography } from '@mui/material'
import { authOptions } from '@/app/constants/api'
import { PaymentMethodsManager } from '../components/PaymentMethodsManager'

export default async function PaymentMethodsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin?redirect=/account/billing/payment-methods')
  }

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Saved methods can be used to pay invoices. Bank payments have no card
        processing fee; credit cards include a 3% surcharge at payment.
      </Typography>
      <PaymentMethodsManager />
    </>
  )
}
