import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Theme Context - manages application theming
const ThemeContext = createContext(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Color presets for theming
const COLOR_PRESETS = {
  default: {
    name: 'Default Blue',
    primary: '#3b82f6',
    positive: '#10b981',
    negative: '#ef4444',
    background: '#0f1419',
    surface: '#1a1f2e',
    surfaceLight: '#252b3b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8'
  },
  emerald: {
    name: 'Emerald',
    primary: '#10b981',
    positive: '#22c55e',
    negative: '#f87171',
    background: '#0a1f15',
    surface: '#142820',
    surfaceLight: '#1e3a2f',
    text: '#ecfdf5',
    textSecondary: '#6ee7b7'
  },
  amber: {
    name: 'Amber',
    primary: '#f59e0b',
    positive: '#84cc16',
    negative: '#f87171',
    background: '#1f1400',
    surface: '#2d2100',
    surfaceLight: '#3d2d00',
    text: '#fef3c7',
    textSecondary: '#fcd34d'
  },
  rose: {
    name: 'Rose',
    primary: '#f43f5e',
    positive: '#22c55e',
    negative: '#fb7185',
    background: '#1f0a10',
    surface: '#2d1118',
    surfaceLight: '#3d1520',
    text: '#ffe4e6',
    textSecondary: '#fda4af'
  },
  purple: {
    name: 'Purple',
    primary: '#8b5cf6',
    positive: '#10b981',
    negative: '#ef4444',
    background: '#130d1f',
    surface: '#1e1428',
    surfaceLight: '#2a1d35',
    text: '#f5f3ff',
    textSecondary: '#c4b5fd'
  }
}

export const ThemeProvider = ({ children }) => {
  // Load theme from localStorage or use defaults
  const [themeName, setThemeName] = useState(() => {
    const saved = localStorage.getItem('marketzen_theme')
    return saved || 'default'
  })

  const [customColors, setCustomColors] = useState(() => {
    const saved = localStorage.getItem('marketzen_custom_colors')
    return saved ? JSON.parse(saved) : null
  })

  const [chartStyle, setChartStyle] = useState(() => {
    const saved = localStorage.getItem('marketzen_chart_style')
    return saved || 'area' // 'area' or 'candlestick'
  })

  const [compactMode, setCompactMode] = useState(() => {
    const saved = localStorage.getItem('marketzen_compact_mode')
    return saved === 'true'
  })

  // Determine current theme
  const currentTheme = useCallback(() => {
    if (themeName === 'custom' && customColors) {
      return customColors
    }
    return COLOR_PRESETS[themeName] || COLOR_PRESETS.default
  }, [themeName, customColors])

  // Apply theme to CSS custom properties
  useEffect(() => {
    const theme = currentTheme()
    const root = document.documentElement

    // Apply colors
    root.style.setProperty('--color-primary', theme.primary)
    root.style.setProperty('--color-positive', theme.positive)
    root.style.setProperty('--color-negative', theme.negative)
    root.style.setProperty('--color-background', theme.background)
    root.style.setProperty('--color-surface', theme.surface)
    root.style.setProperty('--color-surfaceLight', theme.surfaceLight)
    root.style.setProperty('--color-text', theme.text)
    root.style.setProperty('--color-textSecondary', theme.textSecondary)

    // Apply to data attributes for component-level styling
    root.setAttribute('data-theme', themeName)
  }, [themeName, customColors, currentTheme])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('marketzen_theme', themeName)
  }, [themeName])

  useEffect(() => {
    if (customColors) {
      localStorage.setItem('marketzen_custom_colors', JSON.stringify(customColors))
    }
  }, [customColors])

  useEffect(() => {
    localStorage.setItem('marketzen_chart_style', chartStyle)
  }, [chartStyle])

  useEffect(() => {
    localStorage.setItem('marketzen_compact_mode', compactMode)
  }, [compactMode])

  // Theme actions
  const setTheme = useCallback((name) => {
    if (COLOR_PRESETS[name] || name === 'custom') {
      setThemeName(name)
    }
  }, [])

  const setCustomTheme = useCallback((colors) => {
    setCustomColors(colors)
    setThemeName('custom')
  }, [])

  const resetTheme = useCallback(() => {
    setThemeName('default')
    setCustomColors(null)
  }, [])

  const toggleChartStyle = useCallback(() => {
    setChartStyle(prev => prev === 'area' ? 'candlestick' : 'area')
  }, [])

  const toggleCompactMode = useCallback(() => {
    setCompactMode(prev => !prev)
  }, [])

  const value = {
    themeName,
    currentTheme,
    chartStyle,
    compactMode,
    colorPresets: COLOR_PRESETS,
    setTheme,
    setCustomTheme,
    resetTheme,
    toggleChartStyle,
    toggleCompactMode
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext
