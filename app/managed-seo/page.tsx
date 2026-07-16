import React, { Suspense } from 'react'
import { Stack, Typography, Button } from '@mui/material'
import RssFeedIcon from '@mui/icons-material/RssFeed'
import { WP_REST_URI, WP_ROOT } from '@/app/constants/blog'
import backgroundImage from '@/images/background.png'
import { Metadata } from 'next'
import styles from '../labs/forged-seo/page.module.css'
import { ContactForm } from '@/app/contact/components/ContactForm'
import { NewsletterSubscribe } from '@/app/components/NewsletterSubscribe'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Managed SEO Strategy. Powered by ForgedSEO.'
  const description =
    'Get the Content Depth of an In-House Team at a Fraction of the Cost.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://spenpo.com/managed-seo`,
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
  fetch(`${WP_REST_URI}/pages?slug=managed-seo-strategy`).then((res) => res.json())

export default async function ManagedSEO() {
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
                  Inside the Engine: Monthly Strategy & Insights
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  I&apos;m building the future of automated search authority in the
                  open. Subscribe to get a behind-the-scenes look at how we&apos;re
                  scaling content for our partner brands.
                </Typography>
                <ul className={styles.benefitList}>
                  <li>
                    The Strategy Report: Real-world examples of how our agents
                    identify high-traffic clusters and pillar opportunities.
                  </li>
                  <li>
                    Intelligence Updates: New research capabilities we&apos;re adding to
                    the engine to keep your brand ahead of the curve.
                  </li>
                  <li>
                    Market Insights: Brief, developer-led takes on where SEO is
                    heading and how we&apos;re adapting the engine to stay dominant.
                  </li>
                </ul>
                <Suspense fallback={null}>
                  <NewsletterSubscribe archetype="dfy" />
                </Suspense>
              </div>
            </div>
            <div className="spenpo-container">
              <div className="spenpo-stack">
                <Typography variant="h6" component="h2" gutterBottom>
                  Send me a direct line to discuss how ForgedSEO can help your team
                </Typography>
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
