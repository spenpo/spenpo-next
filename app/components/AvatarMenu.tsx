import Logout from '@mui/icons-material/Logout'
import {
  IconButton,
  Avatar,
  MenuItem,
  Divider,
  ListItemIcon,
  Box,
  Typography,
  Button,
} from '@mui/material'
import React, { useContext } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useCachedSignin } from '@/app/hooks/useCachedSignin'
import LanguageIcon from '@mui/icons-material/Language'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { useRouter } from 'next/navigation'
import { MenuContext } from './Menu'

export const AvatarMenu: React.FC = () => {
  const { routeToSignin } = useCachedSignin()
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setMenuChildren, handleClickToOpenMenu } = useContext(MenuContext)

  const avatar = <Avatar src={session?.user.image} />

  return (
    <IconButton
      onClick={(e) => {
        handleClickToOpenMenu(e)
        setMenuChildren(
          <>
            <Box display="flex" p={1} justifyContent="center" alignItems="center">
              {avatar}
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
                <Button
                  sx={{ ml: 1 }}
                  variant="outlined"
                  onClick={() => routeToSignin()}
                >
                  Sign in
                </Button>
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
      sx={{ p: 0 }}
    >
      {avatar}
    </IconButton>
  )
}
