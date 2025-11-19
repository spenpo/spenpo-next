'use client'
import React, {
  useState,
  useMemo,
  createContext,
  Dispatch,
  SetStateAction,
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

type CustomizeThemeContextProps = {
  setMuiDrawerStyleOverrides: Dispatch<SetStateAction<CSSInterpolation>>
}

export const CustomizeThemeContext = createContext({} as CustomizeThemeContextProps)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [muiDrawerStyleOverrides, setMuiDrawerStyleOverrides] =
    useState<CSSInterpolation>({})
  const colorMode = useMemo(() => {
    const ctxVal: CustomizeThemeContextProps = {
      setMuiDrawerStyleOverrides,
    }
    return ctxVal
  }, [])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          primary: {
            main: PRIMARY,
          },
          secondary: {
            main: '#fff',
          },
          tertiary: {
            main: TERTIARY,
            contrastText: '#fff',
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
                  color: 'black',
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
    [muiDrawerStyleOverrides]
  )

  return (
    <CustomizeThemeContext.Provider value={colorMode}>
      <MuiProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiProvider>
    </CustomizeThemeContext.Provider>
  )
}
