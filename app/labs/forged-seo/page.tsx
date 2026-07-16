import React, { Suspense } from 'react'
import { Stack, Typography, Button } from '@mui/material'
import RssFeedIcon from '@mui/icons-material/RssFeed'
import { WP_REST_URI, WP_ROOT } from '@/app/constants/blog'
import backgroundImage from '@/images/background.png'
import { Metadata } from 'next'
import prisma from '@/app/utils/prisma'
import styles from './page.module.css'
import { ContactForm } from '@/app/contact/components/ContactForm'
import { NewsletterSubscribe } from '@/app/components/NewsletterSubscribe'

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
  const html = post
    ? WP_ROOT
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
    : ''

  const wpSectionCount = post
    ? (html.match(/class="[^"]*\bspenpo-container\b[^"]*"/g) || []).length
    : 0
  const wpSectionsOdd = wpSectionCount % 2 === 1

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
          <Stack
            className={styles.cmsContent}
            {...(wpSectionsOdd && { 'data-wp-sections-odd': 'true' })}
          >
            <div id='newsletter-subscribe' className={`spenpo-container ${styles.buildInPublicSection}`}>
              <div className="spenpo-stack">
                <Typography variant="h6" component="h2" gutterBottom>
                  Build-in-Public: Agent Logs
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  I&apos;m building ForgedSEO in the open. Provide your email or scan the
                  QR code below to receive:
                </Typography>
                <ul className={styles.benefitList}>
                  <li>
                    Usage Logs: Real examples of generated clusters and research
                    artifacts.
                  </li>
                  <li>
                    System Updates: New agent capabilities and pipeline improvements.
                  </li>
                  <li>Markdown Strategy: Tips for local-first SEO workflows.</li>
                </ul>
                <Typography component="blockquote" sx={{ mb: 2 }}>SEO professionals know that one post is a fluke, but <strong>42 posts</strong> is a system. I&apos;ve been running ForgedSEO for a private client for 3 months. We just hit a milestone: <strong>350+ organic clicks in the last 28 days</strong>.<br /> Subscribe to see the Agent Logs behind these 42 posts and learn how we&apos;re maintaining this velocity without burning out.</Typography>
                <Suspense fallback={null}>
                  <NewsletterSubscribe archetype="diy" />
                </Suspense>
              </div>
            </div>
            <div className="spenpo-container">
              <div className="spenpo-stack">
                <Typography variant="h6" component="h2" gutterBottom>Send me a direct line to discuss how ForgedSEO can help your team</Typography>
                <Suspense fallback={null}>
                  <ContactForm />
                </Suspense>
              </div>
            </div>
            <div className="spenpo-container">
              <div className="spenpo-stack">
                <Typography variant="h6" component="h2" gutterBottom>
                  Stay in the loop
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  Not ready to get started yet? Subscribe to the RSS feed and
                  we&apos;ll keep you posted on new features, tips, and updates for
                  Forged SEO.
                </Typography>
                <Button
                  component="a"
                  href="/api/feeds/forged-seo"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  className="wp-block-button__link"
                  sx={{ display: 'inline-flex !important' }}
                  size="large"
                  startIcon={<RssFeedIcon />}
                >
                  Subscribe to RSS feed
                </Button>
              </div>
            </div>
          </Stack>
        </Stack>
      ) : (
        <Typography variant="body2">
          Hold up... wait a minute... somethin ain&apos;t right
        </Typography>
      )}
    </Stack>
  )
}
