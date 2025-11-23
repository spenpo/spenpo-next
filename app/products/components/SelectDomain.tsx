import { Grid, Box, Typography, Stack } from '@mui/material'
import { Suspense } from 'react'
import { Domain } from './Domain'
import { LoadMoreBtn } from './LoadMoreBtn'
import { DomainField } from './DomainField'
import { RateLimitProvider } from './RateLimitContext'
import { LIMIT_INCREMENT, TLDS } from '../constants'
import { PageProps } from '@/app/types/app'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/constants/api'
import redis from '@/app/utils/redis'

export async function SelectDomain({
  searchParams,
}: {
  searchParams: PageProps['searchParams']
}) {
  let defaultRenew = null

  const session = await getServerSession(authOptions)

  if (session) {
    const cache = await redis.hgetall(session.user.id)
    if (cache.renew) defaultRenew = JSON.parse(cache.renew)
  }

  const q = searchParams.q ? String(searchParams.q) : ''
  const limit = Number(searchParams.limit) || LIMIT_INCREMENT
  const domainNames: string[] = []

  const arr = q.split('.')
  const NAME = arr[0]
  const TLD = arr[1]

  let count = 0
  for (const key of TLDS.keys()) {
    if (count < limit) {
      if (/^[a-z]+$/.test(key)) {
        // if Q specifies TLD
        if (!!TLD) {
          if (key.startsWith(TLD)) domainNames.push(`${NAME}.${key}`)
        } else domainNames.push(`${NAME}.${key}`)
      }
      count = domainNames.length
    } else break
  }

  return (
    <RateLimitProvider>
      <Stack maxWidth="70em" width="-webkit-fill-available" mx="auto" gap={5}>
        <Stack justifyContent="center" gap={3} alignItems="center">
          <DomainField defaultRenew={defaultRenew} />
        </Stack>
        <Grid container spacing={1} width="100%">
          {q &&
            q.length > 2 &&
            domainNames.map((domainName) => (
              <Grid item xs={12} sm={6} md={3} key={domainName}>
                <Suspense
                  fallback={
                    <Box
                      borderRadius={1}
                      textAlign="center"
                      p={1}
                      sx={{ color: 'lightgray' }}
                    >
                      <Typography>{domainName}</Typography>
                    </Box>
                  }
                >
                  <Domain domainName={domainName} />
                </Suspense>
              </Grid>
            ))}
        </Grid>
        {q && <LoadMoreBtn disabled={limit > domainNames.length} />}
      </Stack>
    </RateLimitProvider>
  )
}
