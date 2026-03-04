// app/sitemap.ts
import { MetadataRoute } from 'next'
import { WP_REST_URI } from './constants/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Fetch your blog posts from a CMS or DB
  const posts = await fetch(`${WP_REST_URI}/posts?per_page=100`).then(res => res.json())
  
  const blogEntries = posts.map((post: { slug: string; date_gmt: string }) => ({
    url: `https://spenpo.com/blog/${post.slug}`,
    lastModified: new Date(post.date_gmt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // 2. Add your static pages
  return [
    {
      url: 'https://spenpo.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://spenpo.com/labs/forged-seo',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://spenpo.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://spenpo.com/labs',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://spenpo.com/consulting',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://spenpo.com/now',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://spenpo.com/contact',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://spenpo.com/about',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...blogEntries,
  ]
}