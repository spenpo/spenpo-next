import React from 'react'
import { ContactForm } from '../contact/components/ContactForm'
import { Stack, Typography } from '@mui/material'
import { WP_REST_URI } from '../constants/blog'
import styles from './consulting.module.css'

const getPost = async () =>
  fetch(`${WP_REST_URI}/pages?slug=consulting`).then((res) => res.json())

export default async function Consulting() {
  const post = await getPost().then((res) => res?.[0])

  return (
    <Stack
      className={styles.cmsContent}
      p={{ xs: 2, sm: 5 }}
      maxWidth="50em"
      mx="auto"
      flex={1}
      width="100%"
      gap={0}
    >
      <Typography component="h1">Let&apos;s build something together</Typography>
      {post ? (
        <Typography
          variant="body2"
          component="div"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />
      ) : (
        <Typography variant="body2">
          Hold up... wait a minute... somethin ain&apos;t right
        </Typography>
      )}
      <ContactForm />
    </Stack>
  )
}
