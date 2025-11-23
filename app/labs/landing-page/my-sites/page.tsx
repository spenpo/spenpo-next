import { Button, Grid, Stack, Typography } from '@mui/material'
import { getServerSession } from 'next-auth'
import React, { Suspense } from 'react'
import prisma from '@/app/utils/prisma'
import { authOptions } from '@/app/constants/api'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { redirect } from 'next/navigation'
import { Tabs } from '@/app/products/landing-page/components/Tabs'
import { SiteCard } from '@/app/products/components/SiteCard'

type Metadata = {
  projectName: { vercelApp: string }
}

export default async function MySites() {
  const session = await getServerSession(authOptions)
  let orders = []
  if (session) {
    orders = await prisma.order.findMany({
      where: { userId: session.user.id, complete: true, productId: 'landing-page' },
    })
  } else redirect('/labs/landing-page')

  return (
    <Stack m={{ xs: 2, sm: 5 }} rowGap={3}>
      <Tabs />
      <Grid container spacing={1}>
        {orders.length > 0 ? (
          orders.map((order) => {
            const metadata = order.metadata as unknown as Metadata
            return (
              <Grid key={order.id} item lg={3} md={6} xs={12}>
                <Suspense
                  fallback={
                    <Stack border="solid 2px #aaa" p={2} borderRadius={1}>
                      loading...
                    </Stack>
                  }
                >
                  <SiteCard name={metadata.projectName.vercelApp} />
                </Suspense>
              </Grid>
            )
          })
        ) : (
          <Stack mx="auto" rowGap={5}>
            <Typography>
              You do not have any sites with us yet. Design one now!
            </Typography>
            <Button
              href={`/labs/landing-page/design`}
              variant="contained"
              sx={{ mx: 'auto' }}
              endIcon={<ChevronRight />}
            >
              design
            </Button>
          </Stack>
        )}
      </Grid>
    </Stack>
  )
}
