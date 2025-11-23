import { Stack } from '@mui/material'
import React from 'react'
import { getProjectVersion } from '@/app/services/github'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/constants/api'
import { Tabs } from '@/app/products/landing-page/components/Tabs'
import { Overview } from '@/app/products/landing-page/components/Overview'

export default async function LandingPageProduct() {
  const session = await getServerSession(authOptions)
  const latestVersionRes = await getProjectVersion('landing-template')
  const packagejson = latestVersionRes.data as unknown as { content: string }
  const base64ToString = Buffer.from(packagejson.content, 'base64').toString()
  const version = JSON.parse(base64ToString).version

  return (
    <Stack m={{ xs: 2, sm: 5 }} rowGap={3}>
      {session && <Tabs />}
      <Overview version={version} />
    </Stack>
  )
}
