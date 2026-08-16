'use client'
import { RouteTabs } from '@/app/components/RouteTabs'

const TABS = [
  {
    label: 'overview',
    href: '/products/landing-page',
    isActive: (pathname: string) => !pathname.endsWith('my-sites'),
  },
  {
    label: 'my sites',
    href: '/products/landing-page/my-sites',
    isActive: (pathname: string) => pathname.endsWith('my-sites'),
  },
]

export const Tabs: React.FC = () => {
  return <RouteTabs tabs={TABS} />
}
