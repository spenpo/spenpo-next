import { getDomainPrice, getDomainStatus } from '@/app/services/vercel'
import { Box, Typography } from '@mui/material'
import { AvailableDomain } from './AvailableDomain'
import { revalidateTag, unstable_cache } from 'next/cache'
import { ReactNode } from 'react'
import { DomainError } from './DomainError'

const Unavailable: React.FC<{ children: ReactNode }> = ({ children }) => (
  <Box
    borderRadius={1}
    textAlign="center"
    p={1}
    sx={{ textDecorationLine: 'line-through' }}
    overflow="scroll"
  >
    <Typography>{children}</Typography>
  </Box>
)

const getStatus = async (domain: string) =>
  unstable_cache(
    async (name) => {
      const req = await getDomainStatus(name)
      const res = await req.json()
      return res
    },
    ['domain-product-status'],
    { tags: [domain] }
  )(domain)

const getPrice = async (domain: string) =>
  unstable_cache(
    async (name) => {
      const req = await getDomainPrice(name)
      const res = await req.json()
      return res
    },
    ['domain-product-price'],
    { tags: [domain] }
  )(domain)

export const Domain = async ({ domainName }: { domainName: string }) => {
  const status = await getStatus(domainName)

  if (status?.available === undefined) {
    revalidateTag(domainName)
    return (
      <DomainError domainName={domainName} errorMessage={status?.error?.message} />
    )
  }

  if (status.available === false) return <Unavailable>{domainName}</Unavailable>

  if (status.available === true) {
    const price = await getPrice(domainName)

    if (!!price?.price)
      return <AvailableDomain domainName={domainName} price={price.price} />
    return <Unavailable>{domainName}</Unavailable>
  }
  return <Unavailable>{domainName}</Unavailable>
}
