'use client'
import { Menu as MuiMenu, MenuProps } from '@mui/material'
import React, {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useMemo,
  useState,
} from 'react'

const Menu: React.FC<Omit<MenuProps, 'open'> & { onClose: () => void }> = ({
  children,
  anchorEl,
  onClose,
}) => {
  const menuOpen = Boolean(anchorEl)

  return (
    <MuiMenu
      open={menuOpen}
      anchorEl={anchorEl}
      onClose={onClose}
      onClick={onClose}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: (theme) => `solid 1px ${theme.palette.divider}`,
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 7,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              border: (theme) => `solid 1px ${theme.palette.divider}`,
              borderRight: 'none',
              borderBottom: 'none',
            },
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {children}
    </MuiMenu>
  )
}

type MenuOpenFn = (event: React.MouseEvent<HTMLElement>) => void

type MenuContextProps = {
  handleClickToOpenMenu: MenuOpenFn
  setMenuChildren: Dispatch<SetStateAction<ReactNode>>
}

export const MenuContext = createContext<MenuContextProps>({} as MenuContextProps)

export const MenuContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const handleClickToOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const [menuChildren, setMenuChildren] = useState<ReactNode>()
  const contextValue = useMemo(() => {
    const val: MenuContextProps = {
      handleClickToOpenMenu,
      setMenuChildren,
    }
    return val
  }, [])

  return (
    <MenuContext.Provider value={contextValue}>
      {children}
      <Menu anchorEl={anchorEl} onClose={handleClose}>
        {menuChildren}
      </Menu>
    </MenuContext.Provider>
  )
}
