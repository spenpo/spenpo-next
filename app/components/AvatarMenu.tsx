import Logout from '@mui/icons-material/Logout'
import WorkOutline from '@mui/icons-material/WorkOutline'
import {
  IconButton,
  Avatar,
  MenuItem,
  Divider,
  ListItemIcon,
  Box,
  Typography,
  Button,
  Badge,
  Tooltip,
} from '@mui/material'
import React, { useContext } from 'react'
import { signOut, useSession } from 'next-auth/react'
import LanguageIcon from '@mui/icons-material/Language'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { useRouter } from 'next/navigation'
import { MenuContext } from './Menu'

const JOIN_HREF = '/auth/signin?redirect=/account/billing'

const pulseSx = {
  '@keyframes avatarPulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(79, 134, 247, 0.55)',
    },
    '70%': {
      boxShadow: '0 0 0 8px rgba(79, 134, 247, 0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(79, 134, 247, 0)',
    },
  },
  animation: 'avatarPulse 2.2s ease-out infinite',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}

function TriggerAvatar({
  image,
  status,
}: {
  image?: string | null
  status: ReturnType<typeof useSession>['status']
}) {
  const avatar = (
    <Avatar src={image ?? undefined} sx={status === 'unauthenticated' ? pulseSx : undefined} />
  )

  if (status === 'unauthenticated') {
    return (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent="Join"
        color="primary"
        sx={{
          '& .MuiBadge-badge': {
            fontSize: 9,
            fontWeight: 700,
            height: 16,
            minWidth: 28,
            px: 0.5,
            borderRadius: 8,
          },
        }}
      >
        {avatar}
      </Badge>
    )
  }

  if (status === 'authenticated') {
    return (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <WorkOutline sx={{ fontSize: 12, color: 'primary.contrastText' }} />
        }
        color="primary"
        sx={{
          '& .MuiBadge-badge': {
            width: 18,
            height: 18,
            minWidth: 18,
            p: 0,
            borderRadius: '50%',
          },
        }}
      >
        {avatar}
      </Badge>
    )
  }

  return avatar
}

export const AvatarMenu: React.FC = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setMenuChildren, handleClickToOpenMenu } = useContext(MenuContext)

  const menuAvatar = <Avatar src={session?.user.image} />
  const triggerLabel =
    status === 'authenticated'
      ? 'Your account'
      : status === 'unauthenticated'
        ? 'Join or sign in'
        : 'Account'

  return (
    <Tooltip title={triggerLabel} arrow>
      <IconButton
        onClick={(e) => {
          handleClickToOpenMenu(e)
          setMenuChildren(
            <>
              <Box display="flex" p={1} justifyContent="center" alignItems="center">
                {menuAvatar}
                {status === 'authenticated' ? (
                  <Typography
                    sx={{
                      ml: 1,
                      minWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Signed in as {session.user.email}
                  </Typography>
                ) : (
                  <Box sx={{ ml: 1, maxWidth: 220 }}>
                    <Button
                      variant="contained"
                      onClick={() => router.push(JOIN_HREF)}
                    >
                      Join or sign in
                    </Button>
                  </Box>
                )}
              </Box>
              {status === 'authenticated' && [
                <Divider key={0} />,
                <MenuItem
                  key={1}
                  onClick={() => router.push('/products/landing-page/my-sites')}
                >
                  <ListItemIcon>
                    <LanguageIcon fontSize="small" />
                  </ListItemIcon>
                  My Sites
                </MenuItem>,
                <MenuItem key={2} onClick={() => router.push('/account/billing')}>
                  <ListItemIcon>
                    <ReceiptLongIcon fontSize="small" />
                  </ListItemIcon>
                  Billing
                </MenuItem>,
                <MenuItem
                  key={3}
                  onClick={() =>
                    signOut({
                      redirect: false,
                    })
                  }
                >
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>,
              ]}
            </>
          )
        }}
        size="small"
        aria-label={triggerLabel}
        sx={{ p: 0, overflow: 'visible' }}
      >
        <TriggerAvatar image={session?.user.image} status={status} />
      </IconButton>
    </Tooltip>
  )
}
