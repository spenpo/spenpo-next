import { Box, Paper, Stack } from '@mui/material'
import React, { ReactNode } from 'react'

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        px: 2,
        py: { xs: 6, sm: 10 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: '32em',
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Stack gap={3} textAlign="center" sx={{ width: '100%' }}>
          {children}
        </Stack>
      </Paper>
    </Box>
  )
}
