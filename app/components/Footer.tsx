import { Stack, Typography, Divider } from '@mui/material'
import Package from '../../package.json'
import React from 'react'
import { SocialIcon } from 'react-social-icons'
import { SOCIALS } from '../constants/socials'

const FooterBullet = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Typography fontWeight={600} color={(theme) => theme.palette.primary.main}>
        {`< / > `}
      </Typography>
      {children}
    </Stack>
  )
}

export const Footer: React.FC = () => {
  return (
    <Stack
      component="footer"
      bgcolor="#555"
      mt="auto"
      p={{ xs: 3, sm: 6 }}
      m={{ xs: 1, sm: 1.5 }}
      borderRadius={2}
      gap={3}
      color="white"
    >
      <Stack
        direction="row"
        flexWrap="wrap"
        width={{ xs: '100%', md: '50em' }}
        justifyContent={{ xs: 'center', md: 'space-between' }}
        mx="auto"
        flex={1}
        gap={{ xs: 5, md: 0 }}
      >
        <Stack
          gap={1}
          sx={{
            textAlign: { xs: 'center', md: 'left' },
            alignItems: { xs: 'center', md: 'flex-start' },
          }}
        >
          <Typography
            fontWeight={600}
            variant="h4"
            sx={{
              fontSize: { xs: '1.25rem', sm: '2.125rem' },
            }}
            color={(theme) => theme.palette.primary.main}
          >
            Work with me
          </Typography>
          <FooterBullet>
            <Typography variant="body2" component="a" href="/consulting">
              Consulting
            </Typography>
          </FooterBullet>
          <FooterBullet>
            <Typography variant="body2" component="a" href="/products/landing-page">
              Start a website
            </Typography>
          </FooterBullet>
          <FooterBullet>
            <Typography
              variant="body2"
              component="a"
              href="https://www.upwork.com/freelancers/~01d3efcc6c1e8b884d"
              target="_blank"
              rel="noreferrer"
            >
              Hire me on Upwork
            </Typography>
          </FooterBullet>
        </Stack>
        <Stack
          gap={1}
          sx={{
            textAlign: { xs: 'center', md: 'left' },
            alignItems: { xs: 'center', md: 'flex-start' },
          }}
        >
          <Typography
            fontWeight={600}
            variant="h4"
            sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}
            color={(theme) => theme.palette.primary.main}
          >
            My work
          </Typography>
          <FooterBullet>
            <Typography
              variant="body2"
              component="a"
              href="https://www.loom.com/share/371f959298fa46138c2e74ac9350ba0b"
            >
              Introduction
            </Typography>
          </FooterBullet>
          <FooterBullet>
            <Typography variant="body2" component="a" href="/projects">
              Projects
            </Typography>
          </FooterBullet>
          <FooterBullet>
            <Typography variant="body2" component="a" href="/blog">
              Writing
            </Typography>
          </FooterBullet>
        </Stack>
        <Stack
          gap={1}
          sx={{
            textAlign: { xs: 'center', md: 'left' },
            alignItems: { xs: 'center', md: 'flex-start' },
          }}
        >
          <Typography
            fontWeight={600}
            variant="h4"
            sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}
            color={(theme) => theme.palette.primary.main}
          >
            Resources
          </Typography>
          <FooterBullet>
            <Typography variant="body2" component="a" href="/about">
              About
            </Typography>
          </FooterBullet>
          <FooterBullet>
            <Typography variant="body2" component="a" href="/contact">
              Contact
            </Typography>
          </FooterBullet>
          <FooterBullet>
            <Typography variant="body2" component="a" href="/privacy-policy">
              Privacy Policy
            </Typography>
          </FooterBullet>
        </Stack>
      </Stack>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        width={{ xs: 'unset', md: '50em' }}
        justifyContent={{ xs: 'center', md: 'space-between' }}
        mx="auto"
        flex={1}
        alignItems={{ xs: 'center', md: 'baseline' }}
        gap={{ xs: 1, sm: 0 }}
      >
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          flexWrap="wrap"
          justifyContent="center"
        >
          Follow
          {SOCIALS.map(({ href, icon }) => (
            <SocialIcon bgColor="#555" key={href} url={href} defaultSVG={icon} />
          ))}
        </Stack>
        <Typography component="span">v{Package.version}</Typography>
      </Stack>
      <Divider
        sx={{ borderColor: 'white', width: { xs: '100%', sm: '50%' }, mx: 'auto' }}
      />
      <Typography
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="center"
        gap={1}
        textAlign="center"
        alignItems="center"
      >
        <span>Built on autonomy</span>
        <FooterBullet></FooterBullet>
        <span>Backed by experience</span>
      </Typography>
      <Typography display="flex" justifyContent="center" gap={1} textAlign="center">
        © 2025 Spencer Pope
      </Typography>
    </Stack>
  )
}
