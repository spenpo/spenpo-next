import React from 'react'
import { Stack, Typography } from '@mui/material'
import { WP_REST_URI, WP_ROOT } from './constants/blog'
import backgroundImage from '@/images/background.png'

import styles from './page.module.css'

const getPost = async () =>
  fetch(`${WP_REST_URI}/pages?slug=welcome`).then((res) => res.json())

export default async function Home() {
  const post = await getPost().then((res) => res?.[0])

  // Use VERCEL_URL (automatically available on Vercel) or fallback to localhost for dev
  const siteUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

  const html = post.content.rendered.replaceAll(WP_ROOT, siteUrl)

  return (
    <Stack>
      {post ? (
        <Stack
          sx={{
            position: 'relative',
            overflow: 'hidden',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundImage: `linear-gradient(#00416b01, #00416b55), url(${backgroundImage.src})`,
            backgroundBlendMode: 'multiply',
          }}
        >
          <Typography
            variant="body2"
            className={styles.cmsContent}
            dangerouslySetInnerHTML={{ __html: html }}
            component="div"
            sx={{
              gap: 0,
            }}
          />
        </Stack>
      ) : (
        <Typography variant="body2">
          Hold up... wait a minute... somethin ain&apos;t right
        </Typography>
      )}
    </Stack>
  )
}
