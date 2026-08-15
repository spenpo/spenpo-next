import React from 'react'
import { Stack, Typography } from '@mui/material'
import DomainVerificationIcon from '@mui/icons-material/DomainVerification'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { getDomainInfo, getDomainPrice } from '@/app/services/vercel'
import { revalidatePath, revalidateTag } from 'next/cache'
import { ClientDomain } from './ClientDomain'

export type DomainProps = {
  name: string
  domains: string[]
  redirect: string | null
  redirectStatusCode: number | null
  project: string
}

export async function Domain({
  name,
  domains,
  redirect,
  redirectStatusCode,
  project,
}: DomainProps) {
  let domain
  let price
  if (!name.endsWith('.vercel.app')) {
    const domainReq = await getDomainInfo(name)
    const d = await domainReq.json()
    domain = d?.domain
    const p = await getDomainPrice(name)
    if (!('error' in p)) price = p.renewalPrice ?? p.price
  }
  return (
    <Stack p={3} border="solid #aaa" borderRadius={1} key={name} gap={3}>
      <ClientDomain
        redirectStatusCode={redirectStatusCode}
        redirect={redirect}
        domains={domains}
        name={name}
        refresh={async () => {
          'use server'
          revalidateTag(name)
        }}
        revalidate={async () => {
          'use server'
          revalidatePath(`/products/landing-page/${project}/domains`)
        }}
      />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={3}
        justifyContent="space-between"
        alignItems="self-start"
      >
        {domain?.verified && (
          <Stack direction="row" gap={1} alignItems="center">
            <DomainVerificationIcon />
            <Typography variant="body2">Verified</Typography>
          </Stack>
        )}
        <Stack direction={{ md: 'row', xs: 'column' }} columnGap={3} rowGap={1}>
          {domain?.expiresAt && (
            <Stack direction="row" gap={1} alignItems="center">
              <Typography variant="body2">
                Exipration Date:{' '}
                <strong>{new Date(domain.expiresAt).toLocaleDateString()}</strong>
              </Typography>
            </Stack>
          )}
          {domain?.renew && (
            <Stack direction="row" gap={1} alignItems="center">
              <CheckCircleOutlineIcon />
              <Typography variant="body2">Auto Renewal On</Typography>
            </Stack>
          )}
          {price && (
            <Stack direction="row" gap={1} alignItems="center">
              <Typography variant="body2">
                Renews at <strong>${price}</strong>
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}
