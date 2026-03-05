import { Feed } from 'feed'
import { NextResponse } from 'next/server'
import { WP_REST_URI } from '@/app/constants/blog'

const SITE_URL = 'https://spenpo.com'

type WpPost = {
  id: number
  slug: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content: { rendered: string }
  date: string
  modified: string
  _embedded?: {
    'wp:featuredmedia'?: { source_url: string }[]
  }
}

function getFeaturedImageUrl(post: WpPost): string | undefined {
  const media = post._embedded?.['wp:featuredmedia']
  return media?.[0]?.source_url
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categoriesRes = await fetch(`${WP_REST_URI}/categories?slug=forged-seo`)
    const categories: { id: number }[] = await categoriesRes.json()
    const categoryId = categories?.[0]?.id

    if (categoryId == null) {
      const feed = new Feed({
        title: 'Forged SEO',
        description: 'Updates on Forged SEO from spenpo.com',
        id: `${SITE_URL}/labs/forged-seo`,
        link: `${SITE_URL}/labs/forged-seo`,
        language: 'en',
        favicon: `${SITE_URL}/favicon.ico`,
      })
      return new NextResponse(feed.rss2(), {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
        },
      })
    }

    const postsRes = await fetch(
      `${WP_REST_URI}/posts?categories=${categoryId}&per_page=100&_embed=true`
    )
    const rawPosts = await postsRes.json()
    const posts: WpPost[] = Array.isArray(rawPosts) ? rawPosts : []

    const feed = new Feed({
      title: 'Forged SEO',
      description: 'Updates on Forged SEO from spenpo.com',
      id: `${SITE_URL}/labs/forged-seo`,
      link: `${SITE_URL}/labs/forged-seo`,
      language: 'en',
      favicon: `${SITE_URL}/favicon.ico`,
      updated: posts.length > 0 ? new Date(posts[0].modified) : new Date(),
    })

    for (const post of posts) {
      const link = `${SITE_URL}/blog/${post.slug}`
      const imageUrl = getFeaturedImageUrl(post)
      feed.addItem({
        title: post.title.rendered,
        id: link,
        link,
        description: post.excerpt.rendered.replace(/<[^>]+>/g, ''),
        content: post.content.rendered,
        date: new Date(post.date),
        image: imageUrl,
      })
    }

    return new NextResponse(feed.rss2(), {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('[forged-seo feed]', error)
    return new NextResponse('Feed unavailable', { status: 500 })
  }
}
