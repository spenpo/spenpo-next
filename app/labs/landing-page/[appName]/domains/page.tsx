import React, { Suspense } from 'react'
import { CircularProgress, Stack } from '@mui/material'
import { authOptions } from '@/app/constants/api'
import { getServerSession } from 'next-auth'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'
import prisma from '@/app/utils/prisma'
import { PageProps } from '@/app/types/app'
import { redirect } from 'next/navigation'
import { getProjectDomains } from '@/app/services/vercel'
import { Add } from '@/app/products/landing-page/[appName]/domains/components/Add'
import {
  Domain,
  type DomainProps,
} from '@/app/products/landing-page/[appName]/domains/components/Domain'
import { revalidatePath } from 'next/cache'

export default async function Domains({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  let domains
  if (session) {
    const project = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        productId: 'landing-page',
        complete: true,
        metadata: {
          path: '$.projectName.vercelApp',
          equals: params?.appName,
        },
      },
    })
    if (project) {
      const domainsReq = await getProjectDomains(params?.appName)
      domains = await domainsReq.json()
    } else redirect(`/labs/landing-page`)
  } else redirect(`/labs/landing-page`)

  return (
    <Stack rowGap={3} m={{ xs: 2, sm: 5 }} gap={3}>
      <Breadcrumbs />
      <Add
        revalidate={async () => {
          'use server'
          revalidatePath(`/labs/landing-page/${params?.appName}/domains`)
        }}
      />
      {!domains && <CircularProgress />}
      {domains?.domains.map((domain: DomainProps, _: number, a: DomainProps[]) => (
        <Suspense key={domain.name}>
          <Domain
            {...domain}
            domains={a.map((d) => d.name)}
            project={params?.appName}
          />
        </Suspense>
      ))}
    </Stack>
  )
}
