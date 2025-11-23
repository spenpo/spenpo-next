'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import { useRouter } from 'next/navigation'

interface RateLimitErrorProps {
  domainName: string
  errorMessage?: string
}

export const RateLimitError: React.FC<RateLimitErrorProps> = ({
  domainName,
  errorMessage,
}) => {
  const router = useRouter()
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    try {
      // Revalidate the cache tag to trigger a fresh fetch
      await fetch(`/api/revalidate?tag=${encodeURIComponent(domainName)}`, {
        method: 'POST',
      })
      router.refresh()
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }, [domainName, router])

  // Extract retry seconds from error message (e.g., "try again in 40 seconds")
  useEffect(() => {
    if (errorMessage) {
      const match = errorMessage.match(/try again in (\d+) seconds?/i)
      if (match) {
        const seconds = parseInt(match[1], 10)
        setRetrySeconds(seconds)
      }
    }
  }, [errorMessage])

  // Countdown timer and auto-retry
  useEffect(() => {
    if (retrySeconds !== null && retrySeconds > 0) {
      const timer = setTimeout(() => {
        setRetrySeconds((prev) => (prev !== null ? prev - 1 : null))
      }, 1000)
      return () => clearTimeout(timer)
    } else if (retrySeconds === 0 && !isRetrying) {
      // Auto-retry when countdown reaches zero
      handleRetry()
    }
  }, [retrySeconds, isRetrying, handleRetry])

  const canRetry = retrySeconds === null || retrySeconds === 0

  return (
    <Box
      borderRadius={1}
      textAlign="center"
      p={1.5}
      sx={{
        outline: 'solid 1px',
        outlineColor: 'warning.main',
        bgcolor: 'warning.light',
        color: 'warning.contrastText',
      }}
    >
      <Typography variant="body2" sx={{ mb: 1 }}>
        {domainName}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
        Rate limit reached.{' '}
        {retrySeconds !== null && retrySeconds > 0
          ? `Retry in ${retrySeconds}s`
          : 'Please try again'}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        onClick={handleRetry}
        disabled={!canRetry || isRetrying}
        sx={{ mt: 0.5 }}
      >
        {isRetrying ? (
          <>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            Retrying...
          </>
        ) : (
          'Retry'
        )}
      </Button>
    </Box>
  )
}
