import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/constants/api'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { PageProps } from '@/app/types/app'
import { stripeProduct } from '@/app/utils/stripe'
import { ViewYourSitesBtn } from '../../components/confirm/ViewYourSitesBtn'
import { getProject } from '@/app/services/vercel'
import { revalidatePath } from 'next/cache'
import { RevalidateBtn } from '../../components/confirm/RevalidateBtn'
import { SiteCard } from '../../components/SiteCard'
import { Order } from '../../types'
import { recursivelyFetchOrder } from '../../functions/recursivelyFetchOrder'

type Metadata = {
  project: string
}

export default async function Confirm({ searchParams }: PageProps) {
  let order: Order
  const session = await getServerSession(authOptions)
  let domains: string[] = []
  if (session) {
    const paymentIntentId = searchParams.payment_intent?.toString()

    if (!paymentIntentId) redirect(`/products/domain`)

    const paymentIntent = await stripeProduct.paymentIntents.retrieve(
      paymentIntentId
    )
    const orderId = paymentIntent.metadata.orderId

    if (orderId) {
      order = await recursivelyFetchOrder(orderId, 'domain', session.user.id)

      const projectReq = await getProject(
        (order.metadata as unknown as Metadata).project
      )
      const project = await projectReq.json()

      domains = project?.targets?.production?.alias ?? []
    } else redirect(`/products/domain`)
  } else redirect(`/products/domain`)

  return (
    <Stack rowGap={3} m="auto">
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
            Your website is being redeployed and will be available shortly at the
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
                    revalidatePath('/products/domain/confirm')
                  }}
                />
              </Stack>
            )}
          </Box>
          <Typography textAlign="center">See below for details</Typography>
          <Box mx="auto">
            <SiteCard name={(order.metadata as unknown as Metadata).project} />
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
