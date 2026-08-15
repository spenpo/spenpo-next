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
    async (name) => getDomainStatus(name),
    ['domain-product-status'],
    { tags: [domain] }
  )(domain)

const getPrice = async (domain: string) =>
  unstable_cache(
    async (name) => getDomainPrice(name),
    ['domain-product-price'],
    { tags: [domain] }
  )(domain)

export const Domain = async ({
  domainName,
  available,
  availabilityError,
}: {
  domainName: string
  available?: boolean
  availabilityError?: string
}) => {
  if (availabilityError) {
    revalidateTag(domainName)
    return (
      <DomainError domainName={domainName} errorMessage={availabilityError} />
    )
  }

  const status =
    typeof available === 'boolean' ? { available } : await getStatus(domainName)

  if ('error' in status) {
    revalidateTag(domainName)
    return (
      <DomainError domainName={domainName} errorMessage={status.error.message} />
    )
  }

  if (!status.available) return <Unavailable>{domainName}</Unavailable>

  const price = await getPrice(domainName)

  if (price && 'error' in price) {
    revalidateTag(domainName)
    return (
      <DomainError domainName={domainName} errorMessage={price.error.message} />
    )
  }

  if (price?.price != null)
    return <AvailableDomain domainName={domainName} price={String(price.price)} />
  return <Unavailable>{domainName}</Unavailable>
}
