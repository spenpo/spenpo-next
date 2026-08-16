'use client'
import { Box, LinearProgress, Tab, Tabs } from '@mui/material'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export type RouteTab = {
  label: string
  href: string
  isActive?: (pathname: string) => boolean
}

function isTabActive(tab: RouteTab, pathname: string) {
  if (tab.isActive) return tab.isActive(pathname)
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`)
}

export function RouteTabs({ tabs }: { tabs: RouteTab[] }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => isTabActive(tab, pathname))
  )
  const pendingIndex = pendingHref
    ? tabs.findIndex((tab) => tab.href === pendingHref)
    : -1
  const value = pendingIndex >= 0 ? pendingIndex : activeIndex

  useEffect(() => {
    if (!pendingHref) return
    const tab = tabs.find((item) => item.href === pendingHref)
    if (tab && isTabActive(tab, pathname)) {
      setPendingHref(null)
    }
  }, [pathname, pendingHref, tabs])

  return (
    <Box>
      <Tabs
        value={value}
        onChange={(_event, next: number) => {
          const tab = tabs[next]
          if (!tab || isTabActive(tab, pathname)) return
          setPendingHref(tab.href)
          router.push(tab.href)
        }}
        sx={{ borderBottom: 1 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.href} label={tab.label} />
        ))}
      </Tabs>
      <Box sx={{ height: 2 }}>
        {pendingIndex >= 0 && <LinearProgress sx={{ height: 2 }} />}
      </Box>
    </Box>
  )
}
