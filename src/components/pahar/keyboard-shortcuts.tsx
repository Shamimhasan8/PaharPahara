'use client'

// PaharPahara — keyboard shortcuts help dialog.
// Opens with `?`. Shows all available shortcuts grouped by category.

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { Lang } from '@/lib/i18n'

interface Shortcut {
  keys: string
  labelEn: string
  labelBn: string
}

const SHORTCUTS: Record<string, Shortcut[]> = {
  navigation: [
    { keys: 'g d', labelEn: 'Go to Dashboard', labelBn: 'ড্যাশবোর্ডে যান' },
    { keys: 'g s', labelEn: 'Go to Sites', labelBn: 'সাইটে যান' },
    { keys: 'g c', labelEn: 'Go to Cases', labelBn: 'কেসে যান' },
    { keys: 'g r', labelEn: 'Go to Reports', labelBn: 'রিপোর্টে যান' },
    { keys: 'g h', labelEn: 'Go to Source Health', labelBn: 'উৎস স্বাস্থ্যে যান' },
    { keys: 'g j', labelEn: 'Go to Jobs', labelBn: 'জবে যান' },
    { keys: 'g p', labelEn: 'Go to Preparedness', labelBn: 'প্রস্তুতিতে যান' },
    { keys: 'g n', labelEn: 'Go to Notifications', labelBn: 'বিজ্ঞপ্তিতে যান' },
    { keys: 'g a', labelEn: 'Go to Audit Log (admin)', labelBn: 'অডিট লগে যান (অ্যাডমিন)' },
  ],
  actions: [
    { keys: '⌘K', labelEn: 'Open command palette', labelBn: 'কমান্ড প্যালেট খুলুন' },
    { keys: '?', labelEn: 'Show this help', labelBn: 'এই সাহায্য দেখান' },
    { keys: 'Esc', labelEn: 'Close dialog / cancel', labelBn: 'ডায়ালগ বন্ধ / বাতিল' },
    { keys: 'L', labelEn: 'Toggle language (EN/BN)', labelBn: 'ভাষা টগল (EN/BN)' },
    { keys: 'T', labelEn: 'Toggle dark/light theme', labelBn: 'ডার্ক/লাইট থিম টগল' },
  ],
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lang: Lang
}

export function KeyboardShortcutsHelp({ open, onOpenChange, lang }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-base">⌨️</span>
            {lang === 'en' ? 'Keyboard shortcuts' : 'কীবোর্ড শর্টকাট'}
          </DialogTitle>
          <DialogDescription>
            {lang === 'en'
              ? 'Navigate faster without leaving the keyboard. Shortcuts work anywhere except inside text fields.'
              : 'কীবোর্ড ছাড়া দ্রুত নেভিগেট করুন। টেক্সট ফিল্ডের ভিতরে ছাড়া শর্টকাট সব জায়গায় কাজ করে।'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 pt-2">
          {Object.entries(SHORTCUTS).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group === 'navigation' ? (lang === 'en' ? 'Navigation' : 'নেভিগেশন') : (lang === 'en' ? 'Actions' : 'অ্যাকশন')}
              </h3>
              <ul className="space-y-1.5">
                {items.map((s) => (
                  <li key={s.keys} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground/80" lang={lang}>{lang === 'en' ? s.labelEn : s.labelBn}</span>
                    <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-muted-foreground/70 mt-2 pt-3 border-t border-border">
          {lang === 'en'
            ? 'Tip: Press ? anywhere to reopen this help. Press Esc to close.'
            : 'টিপ: এই সাহায্য পুনরায় খুলতে যেকোনো জায়গায় ? চাপুন। বন্ধ করতে Esc চাপুন।'}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook that registers global keyboard shortcuts.
// Returns a setter to control the help dialog open state.
export function useKeyboardShortcuts({
  onNavigate,
  onToggleLang,
  onToggleTheme,
  onOpenHelp,
  onOpenCommandPalette,
  enabled,
}: {
  onNavigate: (tab: string) => boolean  // returns true if navigation succeeded
  onToggleLang: () => void
  onToggleTheme: () => void
  onOpenHelp: () => void
  onOpenCommandPalette: () => void
  enabled: boolean
}) {
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let lastG = false
    let gTimer: ReturnType<typeof setTimeout> | null = null

    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas/contenteditable
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
          return
        }
      }
      // Ignore if any meta/ctrl/alt modifier (except for Cmd+K which is handled separately)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toLowerCase()

      // Help dialog
      if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault()
        setHelpOpen((v) => !v)
        return
      }

      // Command palette (Cmd+K is handled in page.tsx, but also support just 'k' without modifier? No — too risky. Keep Cmd+K only.)
      // Skip 'k' here.

      // Two-key navigation: g <letter>
      if (key === 'g') {
        lastG = true
        if (gTimer) clearTimeout(gTimer)
        gTimer = setTimeout(() => {
          lastG = false
        }, 700)
        return
      }

      if (lastG) {
        const map: Record<string, string> = {
          d: 'dashboard',
          s: 'sites',
          c: 'cases',
          r: 'reports',
          h: 'sources',
          j: 'jobs',
          p: 'preparedness',
          n: 'notifications',
          a: 'audit',
        }
        const tab = map[key]
        if (tab) {
          e.preventDefault()
          onNavigate(tab)
        }
        lastG = false
        if (gTimer) clearTimeout(gTimer)
        return
      }

      // Single-key actions
      if (key === 'l') {
        e.preventDefault()
        onToggleLang()
        return
      }
      if (key === 't') {
        e.preventDefault()
        onToggleTheme()
        return
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (gTimer) clearTimeout(gTimer)
    }
  }, [enabled, onNavigate, onToggleLang, onToggleTheme, onOpenHelp, onOpenCommandPalette])

  return { helpOpen, setHelpOpen }
}
