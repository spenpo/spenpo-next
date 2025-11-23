'use client'
import { usePathname } from 'next/navigation'
import { Breadcrumbs as MuiBreadcrumbs, Typography } from '@mui/material'
import Link from 'next/link'
import { styled } from '@mui/material/styles'
import { useCallback, useState } from 'react'

const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#555',
  padding: '0px !important',
  '&:hover': {
    textDecoration: 'underline',
    backgroundColor: 'transparent !important',
  },
}))

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname()
  const [crumbWidth, setCrumbWidth] = useState(100)

  let linkPath = pathname?.split('/')
  linkPath = linkPath?.slice(1)

  const calculateCrumbWidth = useCallback(
    (node: HTMLDivElement) => {
      if (!node) return
      const resizeObserver = new ResizeObserver(() => {
        setCrumbWidth(
          (node.offsetWidth - (linkPath?.length || 0) * 20) / (linkPath?.length || 0)
        )
      })
      resizeObserver.observe(node)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [linkPath]
  )

  return (
    <MuiBreadcrumbs
      ref={calculateCrumbWidth}
      sx={{
        '& .MuiBreadcrumbs-separator, .MuiBreadcrumbs-li': {
          border: 'none',
        },
        '& .MuiBreadcrumbs-li': {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: crumbWidth,
        },
      }}
    >
      {linkPath?.slice(0, linkPath.length - 1).map((crumb, i) => (
        <StyledLink key={crumb} href={'/' + linkPath?.slice(0, i + 1).join('/')}>
          {crumb}
        </StyledLink>
      ))}
      <Typography
        color="text.primary"
        sx={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {linkPath?.at(-1)}
      </Typography>
    </MuiBreadcrumbs>
  )
}
