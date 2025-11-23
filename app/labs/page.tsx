import { Unstable_Grid2, Stack, Typography } from '@mui/material'
import React from 'react'
import prisma from '@/app/utils/prisma'
import { Product } from '@/app/products/components/Product'

export default async function Products() {
  const products = await prisma.product.findMany({ where: { hide: false } })

  return (
    <Stack
      p={{ xs: 2, sm: 5 }}
      gap={5}
      mx="auto"
      maxWidth="50em"
      flex={1}
      width="100%"
    >
      <Typography component="h1">Products</Typography>
      <Unstable_Grid2 container spacing={{ sm: 5, xs: 2 }}>
        {products.map((product) => (
          <Product {...product} key={product.id} />
        ))}
      </Unstable_Grid2>
      <Stack flex={1} justifyContent="flex-end">
        <Typography sx={{ ml: 'auto' }}>{`displaying ${products.length} product${
          products.length > 1 ? 's' : ''
        } of ${products.length}`}</Typography>
      </Stack>
    </Stack>
  )
}
