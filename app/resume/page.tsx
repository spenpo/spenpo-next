import { Typography, Stack } from '@mui/material'
import React from 'react'
import Link from 'next/link'
import { Resume } from './components/Resume'

export default async function ResumePage() {
  const resumeReq = await fetch(`${process.env.WP_ROOT}/wp-json/spcv/v1/resume`)
  const resumeData = await resumeReq.json()

  return (
    <Stack
      sx={{
        color: 'text.primary',
      }}
      mx="auto"
      p={{ xs: 2, sm: 5 }}
      gap={5}
      maxWidth={{ md: '50em' }}
    >
      <Typography component="h1" display="flex" alignItems="baseline" gap={5}>
        Resume
        <Typography>
          <Link
            href="https://www.pope.love/pub/spencer_pope_resume.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 'auto' }}
          >
            Download Resume
          </Link>
        </Typography>
      </Typography>
      <Stack borderTop="solid 2px #999" pt={3} gap={3}>
        <Typography variant="h6" textAlign="center">
          Spencer Pope - Technical Consultant
        </Typography>
        <Resume resumeData={resumeData} />
      </Stack>
    </Stack>
  )
}
