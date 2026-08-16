'use client'

import { Button, Collapse, Stack } from '@mui/material'
import React, { ReactNode, useState } from 'react'

export function MoreSignInOptions({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <Stack gap={1} width="100%" alignItems="center">
      <Button
        variant="text"
        onClick={() => setOpen((current) => !current)}
        sx={{ textTransform: 'none' }}
      >
        {open ? 'Hide more options' : 'More sign-in options'}
      </Button>
      <Collapse in={open} sx={{ width: '100%' }}>
        <Stack gap={1}>{children}</Stack>
      </Collapse>
    </Stack>
  )
}
