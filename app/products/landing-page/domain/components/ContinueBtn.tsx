'use client'

import LoadingButton from '@mui/lab/LoadingButton'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useContext, useState } from 'react'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { ShoppingCartContext } from '@/app/context/shoppingCart'

export const ContinueBtn: React.FC<{
  disabled: boolean
  cache: (domainName: string, price: number, renew: boolean) => Promise<void>
}> = ({ disabled, cache }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    domainName: [, setDomain],
    price: [, setPrice],
    paymentIntentMetadata,
  } = useContext(ShoppingCartContext)
  const [loading, setLoading] = useState(false)

  const domainName = String(searchParams?.get('d'))
  const price = searchParams?.get('p')
    ? Math.round(Number(searchParams?.get('p')) * 100)
    : 0
  const renew = paymentIntentMetadata.renew

  return (
    <LoadingButton
      loading={loading}
      loadingPosition="end"
      endIcon={<ChevronRightIcon />}
      variant="contained"
      onClick={async () => {
        setLoading(true)
        await cache(domainName, price, renew)
        setDomain(domainName || `${searchParams?.get('q')}.vercel.app`)
        setPrice(price)
        router.push('password')
      }}
      disabled={disabled}
      sx={{ ml: 'auto', mb: 'auto' }}
    >
      continue
    </LoadingButton>
  )
}
