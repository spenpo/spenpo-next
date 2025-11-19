import Image from 'next/image'
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Suspense, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AvatarMenu } from './AvatarMenu'
import { type TabProps, Tab } from './Tab'
import { MobileTab } from './MobileTab'
import { CursorClickIcon } from '@phosphor-icons/react'

const TABS: TabProps[] = [
  { id: 'about' },
  {
    id: 'work',
    menuItems: ['labs', 'projects', 'resume'],
  },
  { id: 'now' },
  { id: 'blog' },
  { id: 'consulting' },
]

export const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #6b6b6b 0%, #4a4a4a 50%, #3a3a3a 100%)',
        borderRadius: 50,
        mx: 1.5,
        mt: 1.5,
        width: (theme) => `calc(100% - ${theme.spacing(3)})`,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow:
          '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow:
            '0 6px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          p: '0px !important',
          maxWidth: { xs: 'unset !important', md: '70em !important' },
        }}
      >
        <Toolbar
          disableGutters
          sx={{ display: 'flex', justifyContent: 'space-between', pr: 1.5 }}
        >
          <Box display="flex" flex={1} justifyContent="flex-start">
            <Button
              onClick={() => router.push('/')}
              sx={{
                borderRadius: 50,
                display: 'flex',
                flexDirection: 'row',
                gap: 1,
                p: 2,
                margin: 1.5,
              }}
              variant={pathname === '/' ? 'contained' : 'text'}
              color={pathname === '/' ? 'primary' : 'secondary'}
            >
              <Image
                src="/favicon.ico"
                height={32}
                width={32}
                alt="favicon"
                style={{ borderRadius: 2 }}
              />
              <Typography
                variant="h6"
                sx={{ textDecoration: 'none' }}
                color="secondary"
                display={{ xs: 'none', md: 'block' }}
                noWrap
              >
                Spenpo.com
              </Typography>
            </Button>
          </Box>
          <Box display="flex" flex={1} justifyContent="center">
            <Button
              variant="text"
              color="secondary"
              onClick={() => router.push('/contact')}
              startIcon={<CursorClickIcon />}
              sx={{
                borderRadius: 50,
                display: { xs: 'none', md: 'flex' },
                height: 40,
                px: 2,
                '&:hover': {
                  bgcolor: 'tertiary.main',
                  color: 'secondary.main',
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              Get in touch
            </Button>
            <IconButton
              onClick={() => router.push('/contact')}
              sx={{
                borderRadius: 50,
                display: { xs: 'flex', md: 'none' },
                color: 'secondary.main',
                '&:hover': {
                  bgcolor: 'tertiary.main',
                  color: 'secondary.main',
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <CursorClickIcon fontSize="large" />
            </IconButton>
          </Box>
          <Stack direction="row" gap={1} flex={1} justifyContent="flex-end">
            {TABS.map((tab) => (
              <Tab key={tab.id} {...tab} />
            ))}
            <IconButton
              sx={{
                color: 'white',
                display: { sm: 'none' },
              }}
              onClick={() => setOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Suspense>
              <AvatarMenu />
            </Suspense>
          </Stack>
          <Drawer
            PaperProps={{ sx: { backgroundColor: 'transparent', pt: 8 } }}
            anchor="right"
            open={open}
            onClose={() => setOpen(false)}
          >
            {TABS.map((tab) => (
              <MobileTab key={tab.id} {...tab} />
            ))}
          </Drawer>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
