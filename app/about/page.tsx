import React from 'react'
import { Stack, Typography } from '@mui/material'
import { WP_REST_URI } from '../constants/blog'

const getPost = async () =>
  fetch(`${WP_REST_URI}/pages?slug=about`).then((res) => res.json())

export default async function About() {
  const post = await getPost().then((res) => res?.[0])

  const padding = { sm: 5, xs: 2 }

  return (
    <Stack p={{ sm: 5, xs: 2 }} gap={5} mx="auto" maxWidth="50em">
      <Typography
        component="h1"
        alignItems="baseline"
        display="flex"
        gap={5}
        justifyContent="space-between"
      >
        About
        <Typography display="flex" gap={5}>
          {post?.modified && new Date(post.modified).toLocaleDateString()}
        </Typography>
      </Typography>
      {post ? (
        <Typography
          variant="body2"
          component="div"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
          sx={{
            'figure.wp-block-image': {
              margin: 0,
              img: {
                maxWidth: '100%',
                height: 'auto',
              },
            },
            'pre.wp-block-code': {
              borderRadius: 1,
              maxWidth: {
                xs: `calc(100vw - ${padding.xs * 8 * 2}px)`,
                sm: `calc(100vw - ${padding.sm * 8 * 2}px)`,
              },
            },
            'hr.wp-block-separator': {
              margin: '24px',
            },
            'blockquote.wp-block-quote': {
              margin: '2rem 0',
              padding: '1.5rem 1.5rem 1.5rem 2rem',
              borderLeft: '4px solid rgba(0, 0, 0, 0.2)',
              color: 'var(--cms-text-color-dark, rgba(0, 0, 0, 0.85))',
              background: 'var(--cms-blockquote-bg, rgba(255, 255, 255, 0.6))',
              backdropFilter: 'blur(4px)',
              borderRadius: '0 0.5rem 0.5rem 0',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              lineHeight: '1.8',
            },
          }}
        />
      ) : (
        <Typography variant="body2">
          Hold up... wait a minute... somethin ain&apos;t right
        </Typography>
      )}
    </Stack>
  )
}
