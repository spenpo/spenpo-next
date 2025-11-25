import { Stack, Typography } from '@mui/material'
import { WP_REST_URI } from '../constants/blog'
import { PostList } from './components/PostList'
import { OneThingLayout } from '../components/OneThingLayout'
import { RobotError } from '../components/RobotError'
import { PaginationControls } from './components/PaginationControls'
import { PageProps } from '../types/app'
import { CategoryList } from './components/CategoryList'

export default async function Blog({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const postsPerPage = 10

  const res = await fetch(
    `${WP_REST_URI}/posts?per_page=${postsPerPage}&page=${page}`
  )
  const posts = await res.json()
  const totalPosts = parseInt(res.headers.get('X-WP-Total') || '0')
  const totalPages = Math.ceil(totalPosts / postsPerPage)

  // Fetch all categories
  const categoriesRes = await fetch(`${WP_REST_URI}/categories?per_page=100`)
  const categories = await categoriesRes.json()
  // Filter out uncategorized (usually id 1) and get category IDs
  const categoryIds = categories
    ?.filter(
      (cat: { id: number; name: string; count: number }) =>
        cat.id !== 1 && cat.count > 0
    )
    .map((cat: { id: number }) => cat.id)

  return (
    <Stack p={{ sm: 5, xs: 2 }} gap={5} mx="auto" maxWidth="50em" flex={1}>
      <Stack gap={2}>
        <Typography component="h1">Blog</Typography>
        <CategoryList categories={categoryIds} />
      </Stack>
      {posts ? (
        <Stack gap={{ sm: 5, xs: 2 }} flex={1} justifyContent="space-between">
          <PostList posts={posts} />
          <PaginationControls
            totalPages={totalPages}
            currentPage={page}
            totalPosts={totalPosts}
            displayedPosts={posts.length}
          />
        </Stack>
      ) : (
        <OneThingLayout>
          <RobotError>
            <Typography component="p">deepest apologies,</Typography>
            <Typography component="p">somethings wrong with our server</Typography>
          </RobotError>
        </OneThingLayout>
      )}
    </Stack>
  )
}
