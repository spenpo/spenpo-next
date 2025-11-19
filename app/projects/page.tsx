import { Box, Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'
import { Tabs } from './components/Tabs'
import { WP_REST_URI, WP_ROOT } from '../constants/blog'

const Header: React.FC<{ children: ReactNode }> = ({ children }) => (
  <Typography variant="h5" textAlign="center" border="solid .5px" height={34}>
    {children}
  </Typography>
)

const getPost = async () =>
  fetch(`${WP_REST_URI}/pages?slug=projects`).then((res) => res.json())

export default async function Projects() {
  const post = await getPost().then((res) => res?.[0])

  const html = post.content.rendered
  const content = html.split('\n')

  const description = content.find(
    (text: string) => text.indexOf('spenpo-wp-description') > -1
  )

  const projectsBlockStart = content.findIndex(
    (text: string) => text.indexOf('wpb_page_list') > -1
  )

  const projectsBlockEnd = content.findIndex(
    (text: string, idx: number) =>
      text.indexOf('</ul>') > -1 && idx > projectsBlockStart
  )

  const projectsBlock = content
    .slice(projectsBlockStart, projectsBlockEnd + 1)
    .join('')

  const dirtyProject = projectsBlock.split(`${WP_ROOT}/projects/`)

  dirtyProject.shift()

  const projects = dirtyProject
    .map((project: string) => project.split('/')[0])
    .reverse()

  return (
    <Stack flex={1}>
      <Stack maxWidth="50em" mx="auto" mb="auto" p={{ xs: 2, sm: 5 }} gap={5}>
        <Typography component="h1">Projects</Typography>
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{ __html: description }}
          component="div"
        />
      </Stack>
      <Stack m={2}>
        <Tabs value={-1} tabs={projects} />
        <Stack direction={{ xs: 'column-reverse', md: 'row' }} border="solid .5px">
          <Stack width={{ xs: '100%', md: '25%' }}>
            <Header>description</Header>
            <Box height={{ xs: 100, md: 150 }} border="solid .5px" />
          </Stack>
          <Stack flex={1} width={{ xs: '100%', md: '75%' }}>
            <Header>demo</Header>
            <Box height={{ xs: 100, md: 150 }} border="solid .5px" />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
