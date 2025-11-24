'use client'
import React, {
  useState,
  useMemo,
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
} from 'react'
import {
  createTheme,
  CssBaseline,
  CSSInterpolation,
  ThemeProvider as MuiProvider,
} from '@mui/material'

const DARK_GREY = '#999'
const PRIMARY = '#4f86f7'
const TERTIARY = '#cc736a'
export const HEADER_FOOTER_GRADIENT_LIGHT =
  'linear-gradient(135deg, #6b6b6b 0%, #4a4a4a 50%, #3a3a3a 100%)'
export const HEADER_FOOTER_GRADIENT_DARK =
  'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)'

type ColorMode = 'light' | 'dark'

type CustomizeThemeContextProps = {
  setMuiDrawerStyleOverrides: Dispatch<SetStateAction<CSSInterpolation>>
}

type ColorModeContextProps = {
  mode: ColorMode
  toggleColorMode: () => void
}

export const CustomizeThemeContext = createContext({} as CustomizeThemeContextProps)
export const ColorModeContext = createContext<ColorModeContextProps>({
  mode: 'light',
  toggleColorMode: () => {},
})

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [muiDrawerStyleOverrides, setMuiDrawerStyleOverrides] =
    useState<CSSInterpolation>({})

  // Initialize color mode from localStorage or default to 'light'
  const [mode, setMode] = useState<ColorMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('colorMode') as ColorMode | null
      return stored || 'light'
    }
    return 'light'
  })

  // Persist color mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('colorMode', mode)
    }
  }, [mode])

  const toggleColorMode = React.useCallback(() => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
  }, [])

  const colorMode = useMemo(() => {
    const ctxVal: CustomizeThemeContextProps = {
      setMuiDrawerStyleOverrides,
    }
    return ctxVal
  }, [])

  const colorModeContextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode, toggleColorMode]
  )

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: PRIMARY,
          },
          secondary: {
            main: mode === 'dark' ? '#fff' : '#fff',
          },
          tertiary: {
            main: TERTIARY,
            contrastText: '#fff',
          },
          gradient: {
            headerFooter:
              mode === 'dark'
                ? HEADER_FOOTER_GRADIENT_DARK
                : HEADER_FOOTER_GRADIENT_LIGHT,
          },
        },
        breakpoints: {
          values: {
            xs: 0,
            sm: 650,
            md: 850,
            lg: 1200,
            xl: 1536,
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                overflowX: 'hidden',
              },
              h1: {
                '&.MuiTypography-root': {
                  fontSize: 30,
                },
              },
              a: {
                color: PRIMARY,
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
              },
            },
          },
          MuiTypography: {
            styleOverrides: {
              h4: {
                fontSize: 24,
                fontWeight: 400,
                margin: 0,
              },
              body2: {
                fontSize: 20,
                h3: {
                  fontSize: 30,
                  fontWeight: 400,
                  margin: 0,
                },
                p: {
                  margin: 0,
                },
                'h3 a': {
                  color: mode === 'dark' ? '#fff' : 'black',
                  opacity: '0.87',
                  textDecoration: 'none',
                },
              },
            },
            variants: [
              {
                props: { component: 'div' },
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 40,
                },
              },
              {
                props: { id: 'primary' },
                style: {
                  color: PRIMARY,
                  fontWeight: 600,
                },
              },
              {
                props: { id: 'deployment' },
                style: {
                  fontFamily: `Roboto Mono, Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace`,
                },
              },
            ],
          },
          MuiAccordion: {
            styleOverrides: {
              root: {
                border: `solid 2px ${DARK_GREY}`,
                '&:not(:first-of-type)': {
                  borderTop: `solid 1px ${DARK_GREY}`,
                },
                '&:not(:last-of-type)': {
                  borderBottom: `solid 1px ${DARK_GREY}`,
                },
                '&.Mui-expanded': {
                  border: `solid 2px ${DARK_GREY}`,
                },
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'lowercase',
                borderRadius: '8px 8px 0px 0px',
                border: 'solid 2px',
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              scrollButtons: {
                '&.Mui-disabled': {
                  display: 'none',
                },
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              root: muiDrawerStyleOverrides,
            },
          },
        },
      }),
    [muiDrawerStyleOverrides, mode]
  )

  return (
    <CustomizeThemeContext.Provider value={colorMode}>
      <ColorModeContext.Provider value={colorModeContextValue}>
        <MuiProvider theme={theme}>
          <CssBaseline />
          {children}
        </MuiProvider>
      </ColorModeContext.Provider>
    </CustomizeThemeContext.Provider>
  )
}
