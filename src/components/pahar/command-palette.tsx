'use client'

// PaharPahara — Cmd+K command palette.
// Opens with Cmd/Ctrl+K. Searches across:
//   - Navigation tabs (Dashboard, Sites, Cases, Reports, Source Health, Jobs, Notifications, Preparedness, Audit Log)
//   - Cases (by caseKey / site name)
//   - Sites (by name)
//   - Actions (toggle theme, toggle language, sign out)

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Search, CornerDownLeft, ArrowRight, Sun, Moon, Globe, LogOut, FileText, MapPin, Mountain, Bell, Activity, ShieldAlert, ScrollText, type LucideIcon } from 'lucide-react'
import type { DashboardDataDTO, Role } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'

interface CommandItem {
  id: string
  label: string
  hint?: string
  icon: LucideIcon
  group: 'navigation' | 'cases' | 'sites' | 'actions'
  keywords?: string
  action: () => void
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: DashboardDataDTO
  lang: Lang
  role: Role
  allowedTabs: string[]
  onNavigate: (tab: string) => void
  onSelectSite?: (slug: string) => void
  onSelectCase?: (caseId: string) => void
  onToggleLang?: () => void
  onToggleTheme?: () => void
  onSignOut?: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  data,
  lang,
  role,
  allowedTabs,
  onNavigate,
  onSelectSite,
  onSelectCase,
  onToggleLang,
  onToggleTheme,
  onSignOut,
}: Props) {
  const t = dict[lang]
  const [query, setQuery] = useState('')

  const navIcons: Record<string, LucideIcon> = {
    dashboard: Activity,
    sites: MapPin,
    cases: FileText,
    reports: FileText,
    sources: Mountain,
    jobs: Activity,
    notifications: Bell,
    preparedness: ShieldAlert,
    audit: ScrollText,
  }

  const items: CommandItem[] = useMemo(() => {
    const out: CommandItem[] = []

    // Navigation items (audit is already in allowedTabs for admin)
    for (const tab of allowedTabs) {
      const label = (t.nav as Record<string, string>)[tab] ?? tab
      const Icon = navIcons[tab] ?? Activity
      out.push({
        id: `nav-${tab}`,
        label,
        hint: lang === 'en' ? 'Go to tab' : 'ট্যাবে যান',
        icon: Icon,
        group: 'navigation',
        action: () => onNavigate(tab),
      })
    }

    // Cases
    for (const c of data.cases) {
      out.push({
        id: `case-${c.id}`,
        label: c.caseKey,
        hint: lang === 'en' ? c.siteNameEn : c.siteNameBn,
        icon: FileText,
        group: 'cases',
        keywords: `${c.caseKey} ${c.siteNameEn} ${c.siteNameBn} ${c.status} ${c.disturbanceType ?? ''}`,
        action: () => {
          onNavigate('cases')
          onSelectCase?.(c.id)
        },
      })
    }

    // Sites
    for (const s of data.sites) {
      out.push({
        id: `site-${s.id}`,
        label: lang === 'en' ? s.nameEn : s.nameBn,
        hint: s.district,
        icon: MapPin,
        group: 'sites',
        keywords: `${s.nameEn} ${s.nameBn} ${s.district} ${s.slug}`,
        action: () => {
          onNavigate('sites')
          onSelectSite?.(s.slug)
        },
      })
    }

    // Actions
    out.push({
      id: 'action-lang',
      label: lang === 'en' ? 'Switch to বাংলা' : 'Switch to English',
      hint: lang === 'en' ? 'Toggle language' : 'ভাষা পরিবর্তন',
      icon: Globe,
      group: 'actions',
      action: () => onToggleLang?.(),
    })
    out.push({
      id: 'action-theme',
      label: lang === 'en' ? 'Toggle dark/light theme' : 'ডার্ক/লাইট থিম টগল',
      hint: lang === 'en' ? 'Appearance' : 'অ্যাপিয়ারেন্স',
      icon: Sun,
      group: 'actions',
      action: () => onToggleTheme?.(),
    })
    out.push({
      id: 'action-signout',
      label: t.login.signOut,
      hint: lang === 'en' ? 'End session' : 'সেশন শেষ',
      icon: LogOut,
      group: 'actions',
      action: () => onSignOut?.(),
    })

    return out
  }, [data, lang, role, allowedTabs, t, onNavigate, onSelectSite, onSelectCase, onToggleLang, onToggleTheme, onSignOut])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((it) => {
      return (
        it.label.toLowerCase().includes(q) ||
        it.hint?.toLowerCase().includes(q) ||
        it.keywords?.toLowerCase().includes(q) ||
        it.group.toLowerCase().includes(q)
      )
    })
  }, [items, query])

  // Group filtered items
  const grouped = useMemo(() => {
    const g: Record<string, CommandItem[]> = { navigation: [], cases: [], sites: [], actions: [] }
    for (const it of filtered) g[it.group].push(it)
    return g
  }, [filtered])

  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
    }
  }, [open])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  const executeActive = useCallback(() => {
    const it = filtered[activeIdx]
    if (it) {
      it.action()
      onOpenChange(false)
    }
  }, [filtered, activeIdx, onOpenChange])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      executeActive()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onOpenChange(false)
    }
  }

  const groupOrder: Array<{ key: string; label: string; labelBn: string }> = [
    { key: 'navigation', label: 'Navigation', labelBn: 'নেভিগেশন' },
    { key: 'cases', label: 'Cases', labelBn: 'কেস' },
    { key: 'sites', label: 'Sites', labelBn: 'সাইট' },
    { key: 'actions', label: 'Actions', labelBn: 'অ্যাকশন' },
  ]

  let runningIdx = 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden" onKeyDown={onKeyDown}>
        <DialogHeader className="sr-only">
          <DialogTitle>{lang === 'en' ? 'Command palette' : 'কমান্ড প্যালেট'}</DialogTitle>
          <DialogDescription>
            {lang === 'en' ? 'Search and jump to any section' : 'যেকোনো বিভাগে অনুসন্ধান ও যান'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/30">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'en' ? 'Search tabs, cases, sites, actions…' : 'ট্যাব, কেস, সাইট, অ্যাকশন খুঁজুন…'}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
          <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-border bg-card text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto scroll-thin py-1.5">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8" lang={lang}>
              {lang === 'en' ? 'No matches' : 'কোনো মিল নেই'}
            </div>
          ) : (
            groupOrder.map((g) => {
              const items = grouped[g.key]
              if (items.length === 0) return null
              return (
                <div key={g.key} className="px-1.5 mb-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2 py-1.5" lang={lang}>
                    {lang === 'en' ? g.label : g.labelBn}
                  </div>
                  {items.map((it) => {
                    const idx = runningIdx++
                    const active = idx === activeIdx
                    const Icon = it.icon
                    return (
                      <button
                        key={it.id}
                        onClick={() => {
                          it.action()
                          onOpenChange(false)
                        }}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors ${
                          active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? '' : 'text-muted-foreground'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{it.label}</div>
                          {it.hint && (
                            <div className={`text-[10px] truncate ${active ? 'opacity-80' : 'text-muted-foreground'}`}>{it.hint}</div>
                          )}
                        </div>
                        {active && <CornerDownLeft className="h-3 w-3 opacity-80" />}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
        <div className="px-3 py-1.5 border-t border-border bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span><kbd className="font-mono px-1 py-0.5 rounded border border-border bg-card">↑↓</kbd> {lang === 'en' ? 'navigate' : 'নেভিগেট'}</span>
            <span><kbd className="font-mono px-1 py-0.5 rounded border border-border bg-card">↵</kbd> {lang === 'en' ? 'select' : 'নির্বাচন'}</span>
          </div>
          <span className="font-mono">{filtered.length} {lang === 'en' ? 'results' : 'ফলাফল'}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
