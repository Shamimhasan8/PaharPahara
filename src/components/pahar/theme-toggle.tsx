'use client'

// PaharPahara — light/dark theme toggle button.
// Uses next-themes (already wired in Providers).

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle({ lang }: { lang: 'en' | 'bn' }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Avoid hydration mismatch — render placeholder
    return <Button variant="ghost" size="sm" className="w-9 h-9 p-0" aria-label="Theme" />
  }

  const isDark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 p-0 relative"
      aria-label={isDark ? (lang === 'en' ? 'Switch to light mode' : 'লাইট মোডে যান') : (lang === 'en' ? 'Switch to dark mode' : 'ডার্ক মোডে যান')}
      title={isDark ? (lang === 'en' ? 'Light mode' : 'লাইট মোড') : (lang === 'en' ? 'Dark mode' : 'ডার্ক মোড')}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
