import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/constants/api'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import Link from 'next/link'
import { PageProps } from '@/app/types/app'
import { ViewYourSitesBtn } from '@/app/products/components/confirm/ViewYourSitesBtn'
import redis from '@/app/utils/redis'
import { getProject } from '@/app/services/vercel'
import { SiteCard } from '@/app/products/components/SiteCard'
import { revalidatePath } from 'next/cache'
import { RevalidateBtn } from '@/app/products/components/confirm/RevalidateBtn'
import { Order } from '@/app/products/types'
import { recursivelyFetchOrder } from '@/app/products/functions/recursivelyFetchOrder'

type Metadata = {
  projectName: { vercelApp: string }
}

export default async function Confirm({ searchParams }: PageProps) {
  let order: Order
  const session = await getServerSession(authOptions)
  let fallbackB64

  let domains: string[] = []
  if (session) {
    // This is your test secret API key.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-08-16',
    })
    if (!stripe) redirect(`/labs/landing-page`)

    const paymentIntentId = searchParams.payment_intent?.toString()

    if (!paymentIntentId) redirect(`/labs/landing-page`)

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    const orderId = paymentIntent.metadata.orderId

    if (orderId) {
      order = await recursivelyFetchOrder(orderId, 'landing-page', session.user.id)
      const cache = await redis.hgetall(session.user.id)
      if (cache.HEADSHOT_FILE) {
        fallbackB64 = cache.HEADSHOT_FILE
      }
      const projectReq = await getProject(
        (order.metadata as unknown as Metadata).projectName.vercelApp
      )
      const project = await projectReq.json()

      domains = project?.targets?.production?.alias ?? []
    } else redirect(`/labs/landing-page`)
  } else redirect(`/labs/landing-page`)

  return (
    <Stack rowGap={3} p={{ xs: 2, sm: 5 }}>
      {order.error && (
        <Typography color="red" maxWidth={300}>
          Something went wrong. Please <Link href="/contact">contact support</Link>{' '}
          with your order number: #{order.id}
        </Typography>
      )}
      {order.complete && (
        <>
          <Typography variant="h4" textAlign="center">
            Congratulations
          </Typography>
          <Typography variant="h5" textAlign="center">
            Your website is being deployed and will be available shortly at the
            following URLs:
          </Typography>
          <Box mx="auto">
            {domains.length > 0 ? (
              <Box component="ul">
                {domains.map((domain) => (
                  <Typography key={domain} component="li" variant="subtitle2">
                    {domain}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Stack gap={3} direction="row" alignItems="center">
                <Typography>Data is populating. Click here to refresh:</Typography>
                <RevalidateBtn
                  revalidate={async () => {
                    'use server'
                    revalidatePath('/labs/landing-page/confirm')
                  }}
                />
              </Stack>
            )}
          </Box>
          <Typography textAlign="center">See below for details</Typography>
          <Box mx="auto">
            <SiteCard
              name={(order.metadata as unknown as Metadata).projectName?.vercelApp}
              fallbackB64={fallbackB64}
            />
          </Box>
        </>
      )}
      <ViewYourSitesBtn />
      <Typography textAlign="center">
        Need help? Please <Link href="/contact">contact us</Link> for support
      </Typography>
    </Stack>
  )
}
