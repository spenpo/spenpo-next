import { Box, Link, Stack, Typography } from '@mui/material'
import React from 'react'
import { TagList } from './TagList'

export type Post = {
  id: number
  slug: string
  title: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  tags: number[]
  date: string
}

export const PostList: React.FC<{ posts: Post[] }> = ({ posts }) =>
  posts.map(({ id, slug, title, excerpt, tags, date }: Post) => (
    <Stack
      key={id}
      sx={{
        p: {
          margin: 0,
        },
      }}
      gap={1}
    >
      <Box display="flex" justifyContent="space-between" alignItems="end">
        <Link
          href={`/blog/${slug}`}
          sx={{
            textDecoration: 'none',
            color: 'text.primary',
            ':hover': {
              textDecoration: 'underline',
              color: 'primary.main',
            },
          }}
        >
          <Typography
            component="h1"
            dangerouslySetInnerHTML={{ __html: title.rendered }}
          />
        </Link>
        <Typography component="span">
          {new Date(date).toLocaleDateString()}
        </Typography>
      </Box>
      <TagList tags={tags} />
      <Typography
        dangerouslySetInnerHTML={{
          __html: excerpt.rendered.split(/[\[\]]/).join(''),
        }}
        component="div"
      />
    </Stack>
  ))
