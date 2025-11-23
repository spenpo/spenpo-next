'use client'
import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useRateLimit } from './RateLimitContext'

interface DomainErrorProps {
  domainName: string
  errorMessage?: string
}

export const DomainError: React.FC<DomainErrorProps> = ({ errorMessage }) => {
  const { setRateLimit } = useRateLimit()

  useEffect(() => {
    if (errorMessage) {
      // Check if it's a rate limit error
      const isRateLimit = /rate limit|try again in/i.test(errorMessage)
      if (isRateLimit) {
        // Extract retry seconds from error message
        const match = errorMessage.match(/try again in (\d+) seconds?/i)
        const seconds = match ? parseInt(match[1], 10) : null
        setRateLimit(seconds)
      }
    }
  }, [errorMessage, setRateLimit])

  return (
    <Box
      sx={{ outline: 'solid red' }}
      borderRadius={1}
      textAlign="center"
      p={1}
      color="red"
    >
      <Typography>{errorMessage?.slice(20, 44) || 'Error'}</Typography>
    </Box>
  )
}
