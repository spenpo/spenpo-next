import '@mui/material/styles'
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary']
    gradient: {
      headerFooter: string
    }
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions['primary']
    gradient?: {
      headerFooter?: string
    }
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    tertiary: true
  }
}
