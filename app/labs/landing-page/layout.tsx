import { Metadata } from 'next'
import prisma from '@/app/utils/prisma'
import { ShoppingCartContextProvider } from '@/app/context/shoppingCart'

export async function generateMetadata(): Promise<Metadata> {
  const product = await prisma.product.findFirst({
    where: {
      id: 'landing-page',
    },
  })

  const title = `${product?.name} $0.${product?.price}`
  const description = product?.description

  return {
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
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@s_pop3',
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <ShoppingCartContextProvider>{children}</ShoppingCartContextProvider>
}
