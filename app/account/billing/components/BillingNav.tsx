'use client'
import { RouteTabs } from '@/app/components/RouteTabs'

const TABS = [
  {
    label: 'Invoices',
    href: '/account/billing',
    isActive: (pathname: string) =>
      pathname.startsWith('/account/billing') &&
      !pathname.includes('/payment-methods') &&
      !pathname.includes('/subscriptions'),
  },
  {
    label: 'Subscriptions',
    href: '/account/billing/subscriptions',
    isActive: (pathname: string) => pathname.includes('/subscriptions'),
  },
  {
    label: 'Payment methods',
    href: '/account/billing/payment-methods',
    isActive: (pathname: string) => pathname.includes('/payment-methods'),
  },
]

export const BillingNav: React.FC = () => {
  return <RouteTabs tabs={TABS} />
}
