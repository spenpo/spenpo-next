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
      p={6}
      m={1.5}
      borderRadius={2}
      gap={3}
      color="white"
    >
      <Stack
        direction="row"
        width={{ xs: '100%', sm: '50em' }}
        justifyContent="space-between"
        mx="auto"
        flex={1}
      >
        <Stack gap={1}>
          <Typography
            fontWeight={600}
            variant="h4"
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
        <Stack gap={1}>
          <Typography
            fontWeight={600}
            variant="h4"
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
        <Stack gap={1}>
          <Typography
            fontWeight={600}
            variant="h4"
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
        direction="row"
        width={{ xs: '100%', sm: '50em' }}
        justifyContent="space-between"
        mx="auto"
        flex={1}
        alignItems="baseline"
      >
        <Stack direction="row" gap={1} alignItems="center">
          Follow
          {SOCIALS.map(({ href, icon }) => (
            <SocialIcon bgColor="#555" key={href} url={href} defaultSVG={icon} />
          ))}
        </Stack>
        <Typography display={{ xs: 'none', sm: 'block' }} component="span">
          v{Package.version}
        </Typography>
      </Stack>
      <Divider sx={{ borderColor: 'white', width: '50%', mx: 'auto' }} />
      <Typography display="flex" justifyContent="center" gap={1} textAlign="center">
        Built on autonomy
        <FooterBullet>Backed by experience</FooterBullet>
      </Typography>
      <Typography display="flex" justifyContent="center" gap={1} textAlign="center">
        © 2025 Spencer Pope
      </Typography>
    </Stack>
  )
}
