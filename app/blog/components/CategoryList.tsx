import React from 'react'
import { Category } from './Category'
import { Stack, Typography } from '@mui/material'

export type Maybe<T> = T | null

export const CategoryList: React.FC<{
  categories?: number[]
}> = ({ categories }) => {
  if (!categories || categories.length === 0) return null

  return (
    <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
        Explore:
      </Typography>
      {categories.map((id) => (
        <Category id={id} key={id} />
      ))}
    </Stack>
  )
}
