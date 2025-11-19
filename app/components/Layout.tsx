'use client'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { usePathname } from 'next/navigation'
import { Box } from '@mui/material'
import React from 'react'

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()

  const hideLayoutPaths = ['/products/landing-page/design']

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
        '& footer a': {
          color: 'white',
        },
      }}
      display="flex"
      flexDirection="column"
    >
      {pathname && !hideLayoutPaths.includes(pathname) && <Navbar />}
      {children}
      {pathname && !hideLayoutPaths.includes(pathname) && <Footer />}
    </Box>
  )
}
