'use client'

import { Button } from '@mui/material'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useRef } from 'react'
import { LIMIT_INCREMENT } from '../constants'
import { useRateLimit } from './RateLimitContext'

export const LoadMoreBtn: React.FC<{ disabled: boolean }> = ({ disabled }) => {
  const { isRateLimited, retryAfter } = useRateLimit()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const loadMoreBtn = useRef<HTMLButtonElement | null>(null)
  const mount = useRef(true)
  const limit = searchParams?.get('limit')

  useEffect(() => {
    if (searchParams?.get('limit') && mount.current) {
      mount.current = false
      return
    }
    if (loadMoreBtn.current)
      loadMoreBtn.current.scrollIntoView({ behavior: 'instant' })
  }, [limit]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Button
      ref={loadMoreBtn}
      variant="outlined"
      onClick={() => {
        const current = new URLSearchParams(
          Array.from(searchParams?.entries() || [])
        )
        current.set(
          'limit',
          (
            (Number(searchParams?.get('limit')) || LIMIT_INCREMENT) + LIMIT_INCREMENT
          ).toString()
        )
        const search = current.toString()
        router.push(`${pathname}?${search}`)
      }}
      sx={{ mx: 'auto' }}
      disabled={disabled || isRateLimited}
      title={
        isRateLimited && retryAfter
          ? `Rate limited. Please wait ${retryAfter} seconds.`
          : undefined
      }
    >
      {isRateLimited && retryAfter ? `Rate limited (${retryAfter}s)` : 'load more'}
    </Button>
  )
}
