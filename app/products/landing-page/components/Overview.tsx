'use client'
import { BgImage } from '../../../components/BgImage'
import { Button, Grid, Stack, Typography, Box, Divider } from '@mui/material'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { LANDING_STEPS, Stepper } from './Stepper'
import Link from 'next/link'
import { LinkPreview } from '../../../components/LinkPreview'
import dynamic from 'next/dynamic'
import { RobotError } from '@/app/components/RobotError'
import { OneThingLayout } from '@/app/components/OneThingLayout'

const Player = dynamic(() => import('react-player/lazy'))

const STEP_COPY = [
  {
    copy: (
      <Typography>
        Use our interactive design tools to customize your page before publishing.
        Our content management system allows you to upload a photo, customize text
        and colors, add links to your social media profiles, and create a call to
        action.
      </Typography>
    ),
    video: 'https://youtu.be/OtmFrBkQVcY',
  },
  {
    copy: (
      <>
        <Typography component="span">
          The product includes a <strong>.vercel.app</strong> domain name such as{' '}
        </Typography>
        <Link
          href="https://spenpo-landing.vercel.app"
          target="_blank"
          referrerPolicy="no-referrer"
        >
          spenpo-landing.vercel.app
        </Link>
        <Typography component="span">
          . You can also add a custom domain name onto your purchase which we will
          configure for you. If you already have a domain, reach out to{' '}
          <Link href="/contact" target="_blank" referrerPolicy="no-referrer">
            support
          </Link>{' '}
          and we will help you transfer it into the site.
        </Typography>
      </>
    ),
    link: ['https://spenpo-landing.vercel.app', 'https://www.spenpo.net'],
  },
  {
    copy: (
      <Typography>
        Choose a secure password that will allow you to control the content on your
        site. Logging in to the admin dashboard allows you to go back to the drawing
        board and redesign your site anytime you want at no additional cost. Editing
        your site will look identical to the design process you see in step 1, and
        publishing your changes only takes a few minutes.
      </Typography>
    ),
    video: 'https://youtu.be/PalmKQI5hSg',
  },
  {
    copy: (
      <Typography>
        Pay the one-time $0.99 fee via credit or debit card to begin publishing your
        site. Then return to this page and choose the &quot;my sites&quot; tab where
        you can view and manage all the websites you&apos;ve published with us and
        check the progress changes you&apos;ve made.
      </Typography>
    ),
    video: 'https://youtu.be/beD4DUu32mY',
  },
]

const VideoStep: React.FC<{ step: number }> = ({ step }) => {
  const [error, setError] = useState(false)
  return (
    <>
      <Grid
        item
        lg={3}
        xs={12}
        display="flex"
        alignItems="flex-start"
        justifyContent="center"
        gap={3}
        flexDirection="column"
      >
        <Typography variant="h4">{LANDING_STEPS[step].label}</Typography>
        <Box>{STEP_COPY[step].copy}</Box>
      </Grid>
      <Grid item lg={9} xs={12} id={`react-player-${step}`}>
        {error ? (
          <RobotError>
            <Typography>Error playing YouTube video</Typography>
          </RobotError>
        ) : (
          <Player
            url={STEP_COPY[step].video}
            style={{ margin: 'auto' }}
            height="50vh"
            width="90%"
            fallback={
              <OneThingLayout>
                <Typography>Loading YouTube video</Typography>
              </OneThingLayout>
            }
            onError={() => {
              setError(true)
            }}
          />
        )}
      </Grid>
    </>
  )
}

const LinkStep: React.FC<{ step: number }> = ({ step }) => {
  const Component = useMemo(
    () => STEP_COPY[step].link?.map((link) => <LinkPreview key={link} url={link} />),
    [step]
  ) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Grid
        item
        lg={3}
        xs={12}
        display="flex"
        alignItems="flex-start"
        justifyContent="center"
        gap={3}
        flexDirection="column"
      >
        <Typography variant="h4">{LANDING_STEPS[step].label}</Typography>
        <Box>{STEP_COPY[step].copy}</Box>
      </Grid>
      <Grid item lg={9} xs={12}>
        <Stack
          gap={3}
          direction={{ xs: 'column', sm: 'row' }}
          m="auto"
          width="90%"
          justifyContent="center"
        >
          {Component}
        </Stack>
      </Grid>
    </>
  )
}

const NonVideoStep: React.FC<{ step: number }> = ({ step }) => (
  <>
    <Grid
      item
      lg={3}
      xs={12}
      display="flex"
      alignItems="flex-start"
      justifyContent="center"
      gap={3}
      flexDirection="column"
    >
      <Typography variant="h4">{LANDING_STEPS[step].label}</Typography>
    </Grid>
    <Grid item display="flex" lg={9} xs={12} height="50vh">
      <Box width="90%" m="auto">
        {STEP_COPY[step].copy}
      </Box>
    </Grid>
  </>
)

export const Overview: React.FC<{ version: string }> = ({ version }) => {
  const router = useRouter()

  return (
    <Stack rowGap={5}>
      <Stack gap={3}>
        <Stack
          direction={{ sm: 'row', xs: 'column' }}
          justifyContent="space-between"
          gap={3}
        >
          <Typography variant="h4">A custom website that you design</Typography>
          <Button
            onClick={() => router.push(`/products/landing-page/design`)}
            variant="contained"
            sx={{ ml: 'auto', mb: 'auto' }}
            endIcon={<ChevronRight />}
          >
            design
          </Button>
        </Stack>
        <Typography>
          Design and publish a personalized website for showcasing yourself on the
          web in just minutes. This custom website is responsive and easy to use on
          any device. Share it in person or on social media so everyone else can
          discover and connect with you. You remain in control of the site&apos;s
          content and can login to the admin dashboard anytime to update it for
          free. Best of all, it only costs you one payment of $0.99 to publish your
          site with a free domain name.
        </Typography>
      </Stack>
      <BgImage
        src="/images/landing-page-product.png"
        sx={{
          height: { xl: 600, lg: 500, md: 400, sm: 300, xs: 200 },
          width: '100vw',
          ml: { xs: -2, sm: -5 },
        }}
      />
      <Stack>
        <Stepper variant="overview" />
        <Stack gap={8} mt={3}>
          {LANDING_STEPS.map((step, idx) => {
            let Component = NonVideoStep
            const copy = STEP_COPY[idx]
            if (copy.video) Component = VideoStep
            else if (copy.link) Component = LinkStep
            return (
              <Grid
                key={step.sectionId}
                id={step.sectionId}
                container
                spacing={3}
                sx={{ scrollMarginTop: 12 }}
              >
                <Component step={idx} />
              </Grid>
            )
          })}
        </Stack>
      </Stack>
      <Divider />
      <Stack gap={3}>
        <Stack
          direction={{ sm: 'row', xs: 'column' }}
          justifyContent="space-between"
          gap={3}
        >
          <Typography variant="h4">
            Our goal is to make strong web presence universally achievable
          </Typography>
          <Button
            onClick={() => router.push(`/products/landing-page/design`)}
            variant="contained"
            sx={{ ml: 'auto', mb: 'auto' }}
            endIcon={<ChevronRight />}
          >
            design
          </Button>
        </Stack>
        <Typography>
          You are minutes away from taking a meaningful step for your online
          identity.
        </Typography>
      </Stack>
      <Typography variant="subtitle2" textAlign="center">
        verion: {version}
      </Typography>
    </Stack>
  )
}
