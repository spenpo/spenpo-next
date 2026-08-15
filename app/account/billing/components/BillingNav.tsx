'use client'
import { Tab, Tabs } from '@mui/material'
import { usePathname, useRouter } from 'next/navigation'

export const BillingNav: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const value = pathname?.includes('/payment-methods') ? 1 : 0

  return (
    <Tabs
      value={value}
      onChange={(_event, next) =>
        router.push(
          next === 1 ? '/account/billing/payment-methods' : '/account/billing'
        )
      }
      sx={{ borderBottom: 1 }}
    >
      <Tab label="Invoices" />
      <Tab label="Payment methods" />
    </Tabs>
  )
}
