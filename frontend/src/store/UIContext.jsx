/**
 * store/UIContext.jsx
 * ─────────────────────
 * Provides:
 *   - theme: 'light' | 'dark' (persisted to localStorage)
 *   - toggleTheme()
 *   - mode: 'idle' | 'correction' | 'refine'
 *   - setMode()
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('wr-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [mode, setMode] = useState('idle')

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('wr-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }, [])

  return (
    <UIContext.Provider value={{ theme, toggleTheme, mode, setMode }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be inside UIProvider')
  return ctx
}
