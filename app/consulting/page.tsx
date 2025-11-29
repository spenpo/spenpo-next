import React from 'react'
import { ContactForm } from '../contact/components/ContactForm'
import { Stack, Typography } from '@mui/material'
import { WP_ROOT, WP_REST_URI } from '../constants/blog'
import styles from './consulting.module.css'

const getPost = async () =>
  fetch(`${WP_REST_URI}/pages?slug=consulting`).then((res) => res.json())

export default async function Consulting() {
  const post = await getPost().then((res) => res?.[0])

  // Only replace WordPress URLs in anchor tags (href attributes), leaving images and other content untouched
  const html = WP_ROOT
    ? (() => {
        const wpRoot = WP_ROOT // Store in const for type narrowing
        return post.content.rendered.replace(
          /<a\s+([^>]*)>/gi,
          (match: string, attrs: string) => {
            // Check if href attribute exists and contains WP_ROOT
            const hrefMatch = attrs.match(/href=(["'])([^"']*)\1/i)
            if (hrefMatch && hrefMatch[2].includes(wpRoot)) {
              const quote = hrefMatch[1] // Preserve original quote style
              const oldHref = hrefMatch[2]
              const newHref = oldHref.replaceAll(wpRoot, '/blog')
              // Replace the href value in the attributes string, preserving quote style
              const newAttrs = attrs.replace(
                /href=["'][^"']*["']/i,
                `href=${quote}${newHref}${quote}`
              )
              return `<a ${newAttrs}>`
            }
            return match
          }
        )
      })()
    : post.content.rendered

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
          dangerouslySetInnerHTML={{ __html: html }}
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
