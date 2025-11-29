'use client'

import React, { useState } from 'react'
import { Button } from '@mui/material'
import { Tabs } from '../types/routing'
import { usePathname, useRouter } from 'next/navigation'
import Arrow from '@mui/icons-material/ArrowDropDownSharp'
import { TabProps, isTabActive } from './Tab'

export const MobileTab: React.FC<TabProps> = (tab) => {
  const { id, menuItems } = tab
  const pathname = usePathname()
  const router = useRouter()
  const [expand, setExpand] = useState(false)

  const segment = pathname?.split('/')[1] as Tabs

  const isActive = isTabActive(tab, segment)

  return (
    <>
      <Button
        sx={{
          pl: 3,
          pr: 5,
          borderRadius: 50,
          textTransform: 'capitalize',
          justifyContent: 'flex-start',
        }}
        variant={isActive ? 'contained' : 'text'}
        color={isActive ? 'primary' : 'secondary'}
        onClick={() => {
          if (tab.menuItems) {
            setExpand(!expand)
          } else router.push(`/${id}`)
        }}
        endIcon={menuItems && <Arrow />}
      >
        {id}
      </Button>
      {expand &&
        menuItems?.map((item) => (
          <Button
            color="secondary"
            sx={{
              pl: 5,
              pr: 3,
              borderRadius: 0,
              justifyContent: 'flex-start',
              textTransform: 'capitalize',
            }}
            key={item}
            onClick={() => router.push(`/${item}`)}
          >
            {item}
          </Button>
        ))}
    </>
  )
}
