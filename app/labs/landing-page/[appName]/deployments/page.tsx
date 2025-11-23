import React, { Suspense } from 'react'
import { CircularProgress, Stack } from '@mui/material'
import { authOptions } from '@/app/constants/api'
import { getServerSession } from 'next-auth'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'
import prisma from '@/app/utils/prisma'
import { PageProps } from '@/app/types/app'
import { redirect } from 'next/navigation'
import { getProjectDeployments } from '@/app/services/vercel'
import { DeploymentCard } from '@/app/components/DeploymentCard'

export default async function Deployments({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  let projectDeployments
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
      const projectDeploymentsReq = await getProjectDeployments(params?.appName)
      projectDeployments = await projectDeploymentsReq.json()
    } else redirect(`/labs/landing-page`)
  } else redirect(`/labs/landing-page`)

  return (
    <Stack rowGap={3} m={{ xs: 2, sm: 5 }}>
      <Breadcrumbs />
      <Stack direction="row" justifyContent="space-around">
        <Stack rowGap={1} width="100%">
          {projectDeployments?.deployments.map((deployment: { uid: string }) => (
            <Suspense
              key={deployment.uid}
              fallback={
                <Stack border="solid 2px #aaa" p={2} borderRadius={1}>
                  ...loading
                </Stack>
              }
            >
              <DeploymentCard uid={deployment.uid} />
            </Suspense>
          ))}
          {!projectDeployments && <CircularProgress sx={{ alignSelf: 'center' }} />}
        </Stack>
      </Stack>
    </Stack>
  )
}
