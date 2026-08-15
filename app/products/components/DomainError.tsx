'use client'
import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useRateLimit } from './RateLimitContext'

interface DomainErrorProps {
  domainName: string
  errorMessage?: string
}

export const DomainError: React.FC<DomainErrorProps> = ({
  domainName,
  errorMessage,
}) => {
  const { setRateLimit } = useRateLimit()

  useEffect(() => {
    if (errorMessage) {
      const isRateLimit = /rate limit|try again in|too_many_requests/i.test(
        errorMessage
      )
      if (isRateLimit) {
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
      {domainName && (
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {domainName}
        </Typography>
      )}
      <Typography variant="caption" sx={{ display: 'block', wordBreak: 'break-word' }}>
        {errorMessage || 'Error'}
      </Typography>
    </Box>
  )
}
