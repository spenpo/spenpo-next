import { SnackbarProps, Snackbar as MuiSnackbar, useTheme } from '@mui/material'
import React from 'react'

export const Snackbar: React.FC<SnackbarProps> = (props) => {
  const theme = useTheme()
  return (
    <MuiSnackbar
      {...props}
      ContentProps={{
        sx: {
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          bgcolor: theme.palette.mode === 'dark' ? '#424242' : '#ddd',
        },
      }}
    />
  )
}
