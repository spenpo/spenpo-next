import { UnAuthContext } from '@/app/context/unAuth'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useContext } from 'react'

export const useCachedSignin = () => {
  const { redisId } = useContext(UnAuthContext)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQuery = searchParams?.toString()
  const returnPath = currentQuery ? `${pathname}?${currentQuery}` : pathname
  const params = new URLSearchParams()
  params.set('redirect', returnPath)
  if (redisId) params.set('redisId', redisId)
  const path = `/auth/signin?${params.toString()}`
  return {
    routeToSignin: () => router.push(path),
    path,
  }
}
