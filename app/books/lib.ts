import { WP_REST_URI } from '@/app/constants/blog'
import type { BookReview } from '@/app/constants/books'

export async function getBookReviews(page = 1, perPage = 20): Promise<{
  reviews: BookReview[]
  total: number
  totalPages: number
}> {
  const res = await fetch(
    `${WP_REST_URI}/book_review?per_page=${perPage}&page=${page}&_embed=true&status=publish`,
    { next: { tags: ['book_reviews'] } }
  )

  if (!res.ok) {
    return { reviews: [], total: 0, totalPages: 0 }
  }

  const reviews = (await res.json()) as BookReview[]
  const total = parseInt(res.headers.get('X-WP-Total') || '0', 10)
  const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '0', 10)

  return {
    reviews: Array.isArray(reviews) ? reviews : [],
    total,
    totalPages,
  }
}

export async function getBookReviewBySlug(
  slug: string
): Promise<BookReview | null> {
  const res = await fetch(
    `${WP_REST_URI}/book_review?slug=${encodeURIComponent(slug)}&_embed=true`,
    { next: { tags: ['book_reviews'] } }
  )

  if (!res.ok) {
    return null
  }

  const reviews = (await res.json()) as BookReview[]
  return Array.isArray(reviews) && reviews.length > 0 ? reviews[0] : null
}
