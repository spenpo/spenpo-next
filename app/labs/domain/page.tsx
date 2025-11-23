import React, { Suspense } from 'react'
import { Stack, Typography } from '@mui/material'
import { authOptions } from '@/app/constants/api'
import { getServerSession } from 'next-auth'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'
import prisma from '@/app/utils/prisma'
import { PageProps } from '@/app/types/app'
import { SelectDomain } from '@/app/products/components/SelectDomain'
import { CheckoutBtn } from '@/app/products/domain/components/CheckoutBtn'
import { AppSelect, Order } from '@/app/products/domain/components/AppSelect'
import redis from '@/app/utils/redis'
import { redirect } from 'next/navigation'

export default async function Buy({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  let orders: Order[] = []

  let defaultApp

  const d = searchParams.d ? String(searchParams.d) : ''
  const p = searchParams.p ? String(searchParams.p) : ''

  if (session) {
    orders = await prisma.order.findMany({
      where: { userId: session.user.id, complete: true, productId: 'landing-page' },
    })

    const cache = await redis.hgetall(session.user.id)

    const price = Number(cache.price)
    if (cache.domainName && !d && !!price && !p)
      redirect(
        `/labs/domain?q=${cache.domainName}&d=${cache.domainName}&p=${price / 100}`
      )
    defaultApp = cache.projectName
  }

  return (
    <Stack m={{ xs: 2, sm: 5 }} gap={5} flex={1} justifyContent="flex-start">
      <Breadcrumbs />
      <Stack
        justifyContent="space-between"
        direction={{ xs: 'column', sm: 'row' }}
        gap={1}
      >
        <Stack gap={1}>
          <Typography variant="h5">
            Choose the URL you want your site published to
          </Typography>
          <Typography variant="caption" maxWidth="75%">
            domains can be purchased for <strong>one year</strong> with optional
            renewal
          </Typography>
        </Stack>
        <CheckoutBtn
          cache={async (
            domainName: string,
            projectName: string,
            price: number,
            renew: boolean
          ) => {
            'use server'
            const currentSession = await getServerSession(authOptions)
            if (currentSession?.user?.id)
              await redis.hmset(currentSession.user.id, {
                domainName,
                projectName,
                price,
                renew,
              })
          }}
        />
      </Stack>
      {d && (
        <Suspense>
          <AppSelect orders={orders} defaultValue={defaultApp} />
        </Suspense>
      )}
      <SelectDomain searchParams={searchParams} />
    </Stack>
  )
}
