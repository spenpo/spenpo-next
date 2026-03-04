import React from 'react'
import { Stack, Typography } from '@mui/material'
import { WP_REST_URI, WP_ROOT } from '@/app/constants/blog'
import backgroundImage from '@/images/background.png'
import { Metadata } from 'next'
import prisma from '@/app/utils/prisma'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
    const product = await prisma.product.findFirst({
      where: {
        id: 'forged-seo',
      },
    })
  
    const title = product?.name
    const description = product?.description
  
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://spenpo.com/labs/forged-seo`,
        siteName: 'spenpo.com',
        locale: 'en_US',
        type: 'website',
      },
      robots: {
        index: true,
        follow: true,
        nocache: true,
        googleBot: {
          index: true,
          follow: false,
          noimageindex: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        creator: '@s_pop3',
      },
    }
  }

const getPost = async () =>
  fetch(`${WP_REST_URI}/pages?slug=forged-seo`).then((res) => res.json())

export default async function ForgedSEO() {
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
