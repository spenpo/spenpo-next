'use client'
import { Tab, Tabs } from '@mui/material'
import { usePathname, useRouter } from 'next/navigation'

function tabValue(pathname: string | null) {
  if (pathname?.includes('/payment-methods')) return 2
  if (pathname?.includes('/subscriptions')) return 1
  return 0
}

export const BillingNav: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const value = tabValue(pathname)

  return (
    <Tabs
      value={value}
      onChange={(_event, next) =>
        router.push(
          next === 2
            ? '/account/billing/payment-methods'
            : next === 1
            ? '/account/billing/subscriptions'
            : '/account/billing'
        )
      }
      sx={{ borderBottom: 1 }}
    >
      <Tab label="Invoices" />
      <Tab label="Subscriptions" />
      <Tab label="Payment methods" />
    </Tabs>
  )
}
