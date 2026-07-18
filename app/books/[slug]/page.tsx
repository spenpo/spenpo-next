import { Box, Link, Stack, Typography, Button } from '@mui/material'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import { PageProps } from '@/app/types/app'
import { getBookReviewBySlug } from '../lib'
import {
  buildBookshopUrl,
  getAffiliateIsbn,
  getBookCoverUrl,
} from '@/app/constants/books'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const review = await getBookReviewBySlug(params.slug)
  if (!review) return {}

  const title = review.title.rendered.replace(/<[^>]+>/g, '')
  const description =
    review.excerpt?.rendered?.replace(/<[^>]+>/g, '').slice(0, 200) ||
    `Review of ${title}`
  const cover = getBookCoverUrl(review)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://spenpo.com/books/${params.slug}`,
      siteName: 'spenpo.com',
      locale: 'en_US',
      type: 'article',
      images: cover ? [cover] : undefined,
    },
  }
}

export default async function BookReviewPage({ params }: PageProps) {
  const review = await getBookReviewBySlug(params.slug)
  if (!review) {
    redirect('/books')
  }

  const cover = getBookCoverUrl(review)
  const isbn = getAffiliateIsbn(review.meta)
  const shopUrl = isbn ? buildBookshopUrl(isbn) : ''
  const author = review.meta?.book_author
  const padding = { sm: 5, xs: 2 }

  return (
    <Stack p={padding} gap={{ sm: 4, xs: 2 }} mx="auto" maxWidth="50em">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={3}
        alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
      >
        {cover ? (
          <Box
            sx={{
              position: 'relative',
              width: 160,
              height: 240,
              flexShrink: 0,
              overflow: 'hidden',
              borderRadius: 1,
            }}
          >
            <Image
              src={cover}
              alt=""
              fill
              sizes="160px"
              style={{ objectFit: 'cover' }}
              unoptimized
              priority
            />
          </Box>
        ) : null}
        <Stack gap={1} flex={1}>
          <Typography
            component="h1"
            dangerouslySetInnerHTML={{ __html: review.title.rendered }}
          />
          {author ? (
            <Typography variant="body1" color="text.secondary">
              {author}
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            {new Date(review.date).toLocaleDateString()}
            {review.meta?.book_format ? ` · ${review.meta.book_format}` : ''}
            {review.meta?.book_publisher
              ? ` · ${review.meta.book_publisher}`
              : ''}
          </Typography>
          {shopUrl ? (
            <Box pt={1}>
              <Button
                component="a"
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                variant="contained"
              >
                Buy on Bookshop.org
              </Button>
            </Box>
          ) : null}
        </Stack>
      </Stack>

      {review.content?.rendered ? (
        <Typography
          variant="body2"
          component="div"
          dangerouslySetInnerHTML={{ __html: review.content.rendered }}
          sx={{
            'figure.wp-block-image': {
              margin: 0,
              img: {
                maxWidth: '100%',
                height: 'auto',
              },
            },
            'p:first-of-type': {
              marginTop: 0,
            },
          }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Review coming soon.
        </Typography>
      )}

      {shopUrl ? (
        <Stack gap={1}>
          <Button
            component="a"
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            variant="outlined"
            sx={{ alignSelf: 'flex-start' }}
          >
            Buy on Bookshop.org
          </Button>
          <Typography variant="caption" color="text.secondary">
            As an affiliate of Bookshop.org, I may earn a commission if you buy
            through this link — at no extra cost to you.
          </Typography>
        </Stack>
      ) : null}

      <Link href="/books" variant="body2">
        ← All book reviews
      </Link>
    </Stack>
  )
}
