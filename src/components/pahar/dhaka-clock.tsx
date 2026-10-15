'use client'

// PaharPahara — live Dhaka clock (Asia/Dhaka timezone) for the header.

import { useEffect, useState } from 'react'

export function DhakaClock({ lang }: { lang: 'en' | 'bn' }) {
  const [now, setNow] = useState<string>('')

  useEffect(() => {
    const update = () => {
      const d = new Date()
      // Format: 15:42 BST, 9 Oct
      const time = d.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Dhaka',
        hour12: false,
      })
      const date = d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        timeZone: 'Asia/Dhaka',
      })
      setNow(`${time} BST · ${date}`)
    }
    update()
    const id = setInterval(update, 30 * 1000)
    return () => clearInterval(id)
  }, [lang])

  if (!now) return null

  return (
    <div className="hidden lg:flex flex-col items-end leading-none text-[10px] text-muted-foreground font-mono tabular-nums">
      <span className="font-medium">{now.split(' · ')[0]}</span>
      <span className="opacity-70">{now.split(' · ')[1]}</span>
    </div>
  )
}
