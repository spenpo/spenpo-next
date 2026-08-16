import { Skeleton, Stack } from '@mui/material'

export function BillingListSkeleton() {
  return (
    <Stack gap={2}>
      <Skeleton variant="text" width="40%" height={32} />
      <Skeleton variant="rounded" height={52} />
      <Skeleton variant="rounded" height={52} />
      <Skeleton variant="rounded" height={52} />
    </Stack>
  )
}
