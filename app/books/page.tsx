import { Box, Link, Stack, Typography } from '@mui/material'
import { getBookReviews } from './lib'
import {
  getAffiliateIsbn,
  getBookCoverUrl,
  buildBookshopUrl,
} from '@/app/constants/books'
import { OneThingLayout } from '../components/OneThingLayout'
import { RobotError } from '../components/RobotError'
import { PageProps } from '../types/app'
import Image from 'next/image'

export const metadata = {
  title: 'Books',
  description: 'Book reviews with Bookshop.org affiliate links.',
}

export default async function BooksPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const { reviews, total } = await getBookReviews(page)

  return (
    <Stack p={{ sm: 5, xs: 2 }} gap={5} mx="auto" maxWidth="50em" flex={1}>
      <Stack gap={1}>
        <Typography component="h1">Books</Typography>
        <Typography variant="body2" color="text.secondary">
          Reviews of books I&apos;ve read. Links may earn a commission via
          Bookshop.org.
        </Typography>
      </Stack>

      {reviews.length > 0 ? (
        <Stack gap={3}>
          {reviews.map((review) => {
            const cover = getBookCoverUrl(review)
            const isbn = getAffiliateIsbn(review.meta)
            const shopUrl = isbn ? buildBookshopUrl(isbn) : ''
            const author = review.meta?.book_author

            return (
              <Stack
                key={review.id}
                direction={{ xs: 'column', sm: 'row' }}
                gap={2}
                alignItems={{ xs: 'flex-start', sm: 'stretch' }}
              >
                {cover ? (
                  <Box
                    sx={{
                      position: 'relative',
                      width: 96,
                      height: 144,
                      flexShrink: 0,
                      overflow: 'hidden',
                      borderRadius: 1,
                    }}
                  >
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="96px"
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </Box>
                ) : null}
                <Stack gap={0.5} flex={1}>
                  <Link
                    href={`/books/${review.slug}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'text.primary',
                      ':hover': {
                        textDecoration: 'underline',
                        color: 'primary.main',
                      },
                    }}
                  >
                    <Typography
                      component="h2"
                      dangerouslySetInnerHTML={{
                        __html: review.title.rendered,
                      }}
                    />
                  </Link>
                  {author ? (
                    <Typography variant="body2" color="text.secondary">
                      {author}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    {new Date(review.date).toLocaleDateString()}
                    {review.meta?.book_format
                      ? ` · ${review.meta.book_format}`
                      : ''}
                  </Typography>
                  {shopUrl ? (
                    <Link
                      href={shopUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      variant="body2"
                    >
                      Buy on Bookshop.org
                    </Link>
                  ) : null}
                </Stack>
              </Stack>
            )
          })}
          {total > reviews.length ? (
            <Typography variant="body2" color="text.secondary">
              Showing {reviews.length} of {total} reviews
            </Typography>
          ) : null}
        </Stack>
      ) : (
        <OneThingLayout>
          <RobotError>
            <Typography component="p">No published book reviews yet.</Typography>
            <Typography component="p">
              Check back after the next Libby import + review.
            </Typography>
          </RobotError>
        </OneThingLayout>
      )}
    </Stack>
  )
}
