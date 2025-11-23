import React from 'react'
import { Divider, Stack, Typography } from '@mui/material'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/constants/api'
import { redirect } from 'next/navigation'
import { IncludedWithYourPurchase } from '@/app/products/components/IncludedWithYourPurchase'
import { StripeCheckout } from '@/app/products/components/checkout/StripeCheckout'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'
import { SiteCard } from '@/app/products/components/SiteCard'
import { WarningSummaryRow } from '@/app/products/components/checkout/Summary'
import redis from '@/app/utils/redis'

export default async function Checkout() {
  const session = await getServerSession(authOptions)
  let cache
  if (session) {
    cache = await redis.hgetall(session.user.id)

    if (cache.domainName && cache.price && cache.renew && cache.projectName)
      await redis.expire(session.user.id, 300)
    else redirect('/labs/domain')
  } else redirect('/labs/domain')

  return (
    <Stack rowGap={1} m={{ xs: 2, sm: 5 }}>
      <Breadcrumbs />
      <Stack
        direction={{ xl: 'row', lg: 'row', md: 'row' }}
        justifyContent="space-around"
        mt={5}
      >
        <Stack gap={3}>
          <Typography variant="h4">Checkout</Typography>
          <Stack gap={1}>
            <Typography variant="h5">Order summary</Typography>
          </Stack>
          <Stack rowGap={3}>
            <Typography>
              The domain <strong>{cache.domainName}</strong> will be assigned to the
              following website:
            </Typography>
            <SiteCard name={cache.projectName || ''} />
            <WarningSummaryRow
              title="Auto Renewal"
              data={JSON.parse(cache.renew) ? 'ON' : 'OFF'}
            />
          </Stack>
          <Stack gap={1}>
            <Typography variant="h5">Contact information</Typography>
            <Typography>{session.user.name}</Typography>
            <Typography>{session.user.email}</Typography>
          </Stack>
        </Stack>
        <Divider
          sx={{ display: { md: 'block', sm: 'none' } }}
          orientation="vertical"
          flexItem
        />
        <Stack gap={3} my={5}>
          <IncludedWithYourPurchase />
          <StripeCheckout />
        </Stack>
      </Stack>
    </Stack>
  )
}
