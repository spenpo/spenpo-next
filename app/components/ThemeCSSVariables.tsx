'use client'
import { useContext, useEffect } from 'react'
import { ColorModeContext } from '../context/theme'

/**
 * Component that sets CSS variables on the root element based on theme mode.
 * This allows CSS modules to access theme values via CSS variables.
 */
export const ThemeCSSVariables: React.FC = () => {
  const { mode } = useContext(ColorModeContext)

  useEffect(() => {
    const root = document.documentElement

    if (mode === 'dark') {
      // Dark mode CSS variables
      root.style.setProperty('--cms-link-color', '#90caf9') // Light blue for links in dark mode
      root.style.setProperty('--cms-text-color', '#e0e0e0') // Light gray for text
      root.style.setProperty('--cms-text-color-dark', '#b0b0b0') // Darker gray for secondary text
      root.style.setProperty('--cms-bg-overlay', 'rgba(255, 255, 255, 0.05)') // Light overlay for dark bg
      root.style.setProperty('--cms-bg-container', 'rgba(255, 255, 255, 0.08)') // Container background
      root.style.setProperty('--cms-bg-container-even', '#121212') // Even container background
      root.style.setProperty('--cms-border-color', 'rgba(255, 255, 255, 0.12)') // Border color
      root.style.setProperty('--cms-button-bg', '#1976d2') // Button background (can keep same)
      root.style.setProperty('--cms-button-bg-hover', '#1565c0') // Button hover
      root.style.setProperty('--cms-table-header-bg', 'rgba(255, 255, 255, 0.08)') // Table header
      root.style.setProperty('--cms-card-bg-start', 'rgba(255, 255, 255, 0.1)') // Card gradient start
      root.style.setProperty('--cms-card-bg-end', 'rgba(255, 255, 255, 0.08)') // Card gradient end
      root.style.setProperty('--mui-palette-background-default', '#121212') // Background default
      root.style.setProperty('--cms-blockquote-bg', 'rgba(255, 255, 255, 0.2)') // Blockquote background
      root.style.setProperty(
        '--cms-shadow-sm',
        '0 2px 8px rgba(255, 255, 255, 0.08)'
      ) // Small shadow
      root.style.setProperty(
        '--cms-shadow-md',
        '0 6px 24px rgba(255, 255, 255, 0.06), 0 2px 6px rgba(255, 255, 255, 0.04)'
      ) // Medium shadow
      root.style.setProperty(
        '--cms-shadow-lg',
        '0 10px 30px rgba(255, 255, 255, 0.1), 0 4px 10px rgba(255, 255, 255, 0.06)'
      ) // Large shadow
      root.style.setProperty(
        '--cms-shadow-hover',
        '0 10px 30px rgba(255, 255, 255, 0.1), 0 4px 10px rgba(255, 255, 255, 0.06)'
      ) // Hover shadow
    } else {
      // Light mode CSS variables
      root.style.setProperty('--cms-link-color', '#333') // Dark gray for links
      root.style.setProperty('--cms-text-color', '#000') // Black for text
      root.style.setProperty('--cms-text-color-dark', 'rgba(0, 0, 0, 0.9)') // Dark text
      root.style.setProperty('--cms-bg-overlay', 'rgba(0, 0, 0, 0.05)') // Dark overlay for light bg
      root.style.setProperty('--cms-bg-container', 'rgba(255, 255, 255, 0.92)') // Container background
      root.style.setProperty('--cms-bg-container-even', 'rgba(255, 255, 255, 0.92)') // Even container background
      root.style.setProperty('--cms-border-color', 'rgba(0, 0, 0, 0.08)') // Border color
      root.style.setProperty('--cms-button-bg', '#1976d2') // Button background
      root.style.setProperty('--cms-button-bg-hover', '#1565c0') // Button hover
      root.style.setProperty('--cms-table-header-bg', 'rgba(0, 0, 0, 0.05)') // Table header
      root.style.setProperty('--cms-card-bg-start', 'rgba(255, 255, 255, 0.7)') // Card gradient start
      root.style.setProperty('--cms-card-bg-end', 'rgba(255, 255, 255, 0.55)') // Card gradient end
      root.style.setProperty('--mui-palette-background-default', '#ffffff') // Background default
      root.style.setProperty('--cms-blockquote-bg', 'rgba(255, 255, 255, 0.6)') // Blockquote background
      root.style.setProperty('--cms-shadow-sm', '0 2px 8px rgba(0, 0, 0, 0.08)') // Small shadow
      root.style.setProperty(
        '--cms-shadow-md',
        '0 6px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)'
      ) // Medium shadow
      root.style.setProperty(
        '--cms-shadow-lg',
        '0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06)'
      ) // Large shadow
      root.style.setProperty(
        '--cms-shadow-hover',
        '0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06)'
      ) // Hover shadow
    }
  }, [mode])

  return null // This component doesn't render anything
}
