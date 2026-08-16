export const BOOKSHOP_ORG_AFFILIATE_ID = '125387'

export const buildBookshopUrl = (isbn: string): string => {
  const cleaned = isbn.replace(/[^0-9Xx]/g, '')
  if (!cleaned) return ''
  return `https://bookshop.org/a/${BOOKSHOP_ORG_AFFILIATE_ID}/${cleaned}`
}

export type BookReviewMeta = {
  book_isbn?: string
  bookshop_isbn?: string
  book_author?: string
  book_format?: string
  book_publisher?: string
  libby_title_id?: string
  libby_cover_url?: string
  libby_borrowed_at?: string
}

export type BookReview = {
  id: number
  slug: string
  date: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  /** Hostinger AI External Featured Image URL (`_thumbnail_ext_url`). */
  external_featured_image?: string
  meta?: BookReviewMeta
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url?: string
    }[]
  }
}

export const getAffiliateIsbn = (meta?: BookReviewMeta): string => {
  const override = meta?.bookshop_isbn?.trim()
  if (override) return override
  return meta?.book_isbn?.trim() || ''
}

export const getBookCoverUrl = (review: BookReview): string | null => {
  const featured = review._embedded?.['wp:featuredmedia']?.[0]?.source_url
  if (featured) return featured
  const external = review.external_featured_image?.trim()
  if (external) return external
  return review.meta?.libby_cover_url || null
}
