import { Layout } from './components/Layout'
import { NextAuthProvider } from './context/nextAuth'
import { ThemeProvider } from './context/theme'
import { Metadata } from 'next'
import React from 'react'
import { SnackbarContextProvider } from './context/snackbar'
import { UnAuthContextProvider } from './context/unAuth'
import { MenuContextProvider } from './components/Menu'
import Script from 'next/script'
import { WP_CHILD_THEME_RESOURCES } from './constants/blog'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Spencer Pope'
  const description = 'Developer & Entrepreneur'

  return {
    metadataBase: new URL(`https://${process.env.VERCEL_URL}`),
    title,
    description,
    openGraph: {
      title,
      description,
      url: process.env.VERCEL_URL,
      siteName: 'spenpo.com',
      locale: 'en_US',
      type: 'website',
    },
    robots: {
      index: false,
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
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/favicon.ico',
      other: {
        rel: 'apple-touch-icon-precomposed',
        url: '/favicon.ico',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href={`${WP_CHILD_THEME_RESOURCES}/includes/prism.css`}
          // Temporary development aid: uncomment to break cache when needed
          // ?v=${Date.now()}
        />
        <link
          rel="stylesheet"
          href={`${WP_CHILD_THEME_RESOURCES}/assets/css/chat-styles.css`}
          // Temporary development aid: uncomment to break cache when needed
          // ?v=${Date.now()}
        />
      </head>
      <body style={{ margin: 0 }} suppressHydrationWarning>
        <NextAuthProvider>
          <UnAuthContextProvider>
            <ThemeProvider>
              <SnackbarContextProvider>
                <MenuContextProvider>
                  <Layout>{children}</Layout>
                </MenuContextProvider>
              </SnackbarContextProvider>
            </ThemeProvider>
          </UnAuthContextProvider>
        </NextAuthProvider>
        <Script
          src={`${WP_CHILD_THEME_RESOURCES}/includes/prism.js`}
          // You can use different strategies:
          // beforeInteractive - Load before page becomes interactive
          // afterInteractive (default) - Load immediately after page becomes interactive
          // lazyOnload - Load during idle time
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
