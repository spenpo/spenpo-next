'use client'

import React, { useContext } from 'react'
import { Button, MenuItem } from '@mui/material'
import { Tabs } from '../types/routing'
import { usePathname, useRouter } from 'next/navigation'
import Arrow from '@mui/icons-material/ArrowDropDownSharp'
import { MenuContext } from './Menu'

export const isTabActive = (tab: TabProps, segment?: Tabs): boolean => {
  if (tab.menuItems) {
    if (segment && tab.menuItems.includes(segment)) return true
  }
  if (segment && tab.id === segment) return true
  return false
}

export type TabProps = { id: Tabs; menuItems?: Tabs[] }
export const Tab: React.FC<TabProps> = (tab) => {
  const { id, menuItems } = tab
  const { handleClickToOpenMenu, setMenuChildren } = useContext(MenuContext)
  const pathname = usePathname()
  const router = useRouter()

  const segment = pathname?.split('/')[1] as Tabs

  const isActive = isTabActive(tab, segment)

  return (
    <Button
      sx={{
        px: 2,
        display: { xs: 'none', sm: 'flex' },
        borderRadius: 50,
        textTransform: 'capitalize',
      }}
      variant={isActive ? 'contained' : 'text'}
      color={isActive ? 'primary' : 'secondary'}
      onClick={(e) => {
        if (tab.menuItems) {
          handleClickToOpenMenu(e)
          setMenuChildren(
            menuItems?.map((item) => (
              <MenuItem
                sx={{ textTransform: 'capitalize' }}
                key={item}
                onClick={() => router.push(`/${item}`)}
              >
                {item}
              </MenuItem>
            ))
          )
        } else router.push(`/${id}`)
      }}
      endIcon={menuItems && <Arrow />}
    >
      {id}
    </Button>
  )
}
