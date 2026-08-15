'use client'

import LoadingButton from '@mui/lab/LoadingButton'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useContext, useState } from 'react'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { ShoppingCartContext } from '@/app/context/shoppingCart'

export const CheckoutBtn: React.FC<{
  cache: (
    domainName: string,
    projectName: string,
    price: number,
    renew: boolean
  ) => Promise<void>
}> = ({ cache }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    domainName: [, setDomain],
    price: [, setPrice],
    paymentIntentMetadata,
  } = useContext(ShoppingCartContext)
  const [loading, setLoading] = useState(false)

  const domainName = String(searchParams?.get('d'))
  const projectName = paymentIntentMetadata.projectName
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
        setDomain(domainName)
        setPrice(price)
        await cache(domainName, projectName!, price, renew)
        router.push('/products/domain/checkout')
      }}
      disabled={!searchParams?.get('d') || !paymentIntentMetadata.projectName}
      sx={{ ml: 'auto', mb: 'auto' }}
    >
      Checkout
    </LoadingButton>
  )
}
