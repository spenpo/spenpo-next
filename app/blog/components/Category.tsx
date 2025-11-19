import { Button, Tooltip } from '@mui/material'
import Link from 'next/link'
import React from 'react'
import { WP_REST_URI } from '@/app/constants/blog'
import { decodeHtmlEntities } from '@/app/utils/string'

export type Maybe<T> = T | null

export const Category: React.FC<{
  id?: number
}> = async ({ id }) => {
  const category = await fetch(`${WP_REST_URI}/categories/${id}`).then((res) =>
    res.json()
  )

  const { name, count } = category
  return (
    <Tooltip title={`${count} posts`} placement="top" key={id}>
      <Button
        component={Link}
        href={`/blog/category/${id}`}
        variant="outlined"
        // color="secondary"
        size="small"
        sx={{
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 2,
          px: 2,
          py: 0.5,
        }}
      >
        {decodeHtmlEntities(name)}
      </Button>
    </Tooltip>
  )
}
