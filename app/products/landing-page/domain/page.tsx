import React from 'react'
import { Stack, Typography } from '@mui/material'
import { ContinueBtn } from './components/ContinueBtn'
import { Stepper } from '../components/Stepper'
import redis from '../../../utils/redis'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { PageProps } from '../../../types/app'
import { SelectDomain } from '../../components/SelectDomain'
import { authOptions } from '@/app/constants/api'

export default async function DomainStep({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/products/landing-page/design')

  const cache = await redis.hgetall(session.user.id)

  if (cache.HEADSHOT_FILE) await redis.expire(session.user.id, 300)
  else redirect('/products/landing-page/design')

  const q = searchParams.q ? String(searchParams.q) : ''
  const d = searchParams.d ? String(searchParams.d) : ''
  const p = searchParams.p ? String(searchParams.p) : ''

  const price = Number(cache.price)
  if (cache.domainName && !d && !!price && !p)
    redirect(
      `/products/landing-page/domain?q=${cache.domainName}&d=${cache.domainName}&p=${
        price / 100
      }`
    )

  const arr = q.split('.')
  const TLD = arr[1]

  return (
    <Stack m={{ xs: 2, sm: 5 }} gap={5} flex={1} justifyContent="flex-start">
      <Stack>
        <Stepper />
      </Stack>
      <Stack
        justifyContent="space-between"
        direction={{ xs: 'column', sm: 'row' }}
        gap={1}
      >
        <Stack gap={1}>
          <Typography variant="h5">
            Choose the URL you want your site published to
          </Typography>
          {!TLD && !d ? (
            <Typography variant="caption" maxWidth="75%">
              <strong>.vercel.app</strong> domains are included even if you purchase
              additional custom domains.
            </Typography>
          ) : (
            <Typography variant="caption" maxWidth="75%">
              domains can be purchased for <strong>one year</strong> with optional
              renewal
            </Typography>
          )}
        </Stack>
        <ContinueBtn
          disabled={!q}
          cache={async (domainName: string, price: number, renew: boolean) => {
            'use server'
            await redis.hmset(session?.user.id, {
              domainName,
              price,
              renew,
            })
          }}
        />
      </Stack>
      <SelectDomain searchParams={searchParams} />
    </Stack>
  )
}
