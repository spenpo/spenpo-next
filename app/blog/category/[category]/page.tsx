import { PostList } from '@/app/blog/components/PostList'
import { Box, Stack, Typography } from '@mui/material'
import { PageProps } from '@/app/types/app'
import { redirect } from 'next/navigation'
import { WP_REST_URI } from '@/app/constants/blog'
import { decodeHtmlEntities } from '@/app/utils/string'

export default async function Category({ params }: PageProps) {
  const category = await fetch(`${WP_REST_URI}/categories/${params.category}`).then(
    (res) => res.json()
  )

  if (!category || !category.name || category.code === 'rest_term_invalid') {
    return redirect('/blog')
  }

  const allPosts = await fetch(
    `${WP_REST_URI}/posts${category ? `?categories=${category.id}` : '/'}`
  ).then((res) => res.json())

  if (allPosts && allPosts.length > 0)
    return (
      <Stack p={{ sm: 5, xs: 2 }} gap={{ sm: 5, xs: 2 }} mx="auto" maxWidth="50em">
        <Stack gap={1}>
          <Box display="flex" gap={1} alignItems="baseline">
            <Typography component="h1">Category:</Typography>
            <Typography
              component="span"
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
              }}
            >
              {decodeHtmlEntities(category.name)}
            </Typography>
          </Box>
          {category.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              {decodeHtmlEntities(category.description)}
            </Typography>
          )}
        </Stack>
        <PostList posts={allPosts} />
      </Stack>
    )
  else redirect('/blog')
}
