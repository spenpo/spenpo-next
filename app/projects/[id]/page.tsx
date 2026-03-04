import 'animate.css'
import '../../../svelte-apps/dist/lang-flash-bundle.css'
import '../../../svelte-apps/dist/two-truths-bundle.css'

import { RobotError } from '@/app/components/RobotError'
import { Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'
import { MetadataProps, PageProps } from '@/app/types/app'
import { Tabs } from '../components/Tabs'
import { Metadata } from 'next'
import { METADATA } from '@/app/constants/projects'
import { WP_REST_URI } from '@/app/constants/blog'
import { projects } from '../components'

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const title = params.id
  const description = METADATA[title]?.description
  const images = [METADATA[title]?.image || '/images/headshot.jpeg']

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://spenpo.com/projects/${params.id}`,
      siteName: 'spenpo.com',
      locale: 'en_US',
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@s_pop3',
      images,
    },
  }
}

const Header: React.FC<{ children: ReactNode }> = ({ children }) => (
  <Typography variant="h5" textAlign="center" border="solid .5px" height={34}>
    {children}
  </Typography>
)

const Body: React.FC<{
  children?: ReactNode
  maxWidth: string
  dangerouslySetInnerHTML?: string
}> = ({ children, dangerouslySetInnerHTML, maxWidth }) => {
  const props = {
    flex: 1,
    border: 'solid .5px',
    maxWidth: { xs: 'unset', md: maxWidth },
    maxHeight: {
      xs: 'unset',
      md: 'calc(100vh - 264.5px)',
      xl: 'calc(100vh - 267px)',
    },
    overflow: 'scroll',
    sx: {
      boxSizing: 'unset',
      lineHeight: 1,
      'figure.wp-block-table': {
        margin: 0,
      },
      'th,td': {
        padding: 2,
        textAlign: 'left',
        borderBottom: 'solid 1px #ccc',
        borderCollapse: 'collapse',
      },
      '.spenpo-vercel-deploy': {
        marginLeft: 3,
      },
    },
    justifyContent: 'flex-start',
  }

  return children ? (
    <Stack {...props}>{children}</Stack>
  ) : (
    <Stack
      {...props}
      component="div"
      dangerouslySetInnerHTML={{ __html: dangerouslySetInnerHTML || '' }}
    />
  )
}

const getProjects = async () =>
  fetch(`${WP_REST_URI}/pages?parent=215&per_page=99`).then((res) => res.json())

export default async function Projects({ params }: PageProps) {
  const projectsData = await getProjects()
  const projectNames = projectsData.map((p: Record<string, unknown>) => p.slug)

  const project = params.id

  const description = projectsData
    .find((p: Record<string, unknown>) => p.slug === project)
    ?.content?.rendered?.split('\n\n\n\n<p>Visit')[0]

  return (
    <Stack m={2} flex={1}>
      <Tabs value={projectNames.indexOf(project)} tabs={projectNames} />
      <Stack
        direction={{ xs: 'column-reverse', md: 'row' }}
        flex={1}
        border="solid .5px"
      >
        <Stack maxWidth={{ xs: '100%', md: '25%' }}>
          <Header>description</Header>
          <Body maxWidth="calc(25vw - 9px)" dangerouslySetInnerHTML={description} />
        </Stack>
        <Stack flex={1} maxWidth={{ xs: '100%', md: '75%' }}>
          <Header>demo</Header>
          <Body maxWidth="calc(75vw)">
            {projects[project] || (
              <RobotError>this project doesn&apos;t exist yet</RobotError>
            )}
          </Body>
        </Stack>
      </Stack>
    </Stack>
  )
}
