'use client'
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'

interface RateLimitContextType {
  isRateLimited: boolean
  retryAfter: number | null
  setRateLimit: (retryAfter: number | null) => void
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined)

export const RateLimitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)

  const setRateLimit = useCallback((seconds: number | null) => {
    setIsRateLimited(seconds !== null)
    setRetryAfter(seconds)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (retryAfter !== null && retryAfter > 0) {
      const timer = setTimeout(() => {
        setRetryAfter((prev) => {
          if (prev === null || prev <= 1) {
            setIsRateLimited(false)
            return null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearTimeout(timer)
    } else if (retryAfter === 0) {
      setIsRateLimited(false)
      setRetryAfter(null)
    }
  }, [retryAfter])

  return (
    <RateLimitContext.Provider value={{ isRateLimited, retryAfter, setRateLimit }}>
      {children}
    </RateLimitContext.Provider>
  )
}

export const useRateLimit = () => {
  const context = useContext(RateLimitContext)
  if (!context) {
    throw new Error('useRateLimit must be used within RateLimitProvider')
  }
  return context
}
