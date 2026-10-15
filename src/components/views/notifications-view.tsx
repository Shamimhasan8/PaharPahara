'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, CheckCheck, AlertTriangle, Info, AlertCircle, CheckCircle2, Settings2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { SeverityBadge, relativeTime } from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
  reload: () => void
}

type CategoryKey = 'case' | 'bmd' | 'source' | 'job' | 'report'

const CATEGORY_LABELS: Record<CategoryKey, { en: string; bn: string }> = {
  case: { en: 'Case events', bn: 'কেস ইভেন্ট' },
  bmd: { en: 'BMD alerts', bn: 'BMD সতর্কতা' },
  source: { en: 'Source health', bn: 'উৎস স্বাস্থ্য' },
  job: { en: 'Job status', bn: 'জব অবস্থা' },
  report: { en: 'Reports', bn: 'রিপোর্ট' },
}

export function NotificationsView({ data, lang, reload }: Props) {
  const t = dict[lang]
  const qc = useQueryClient()
  const { notifications } = data
  const unread = notifications.filter((n) => !n.read).length

  // Category filter settings (persisted to localStorage)
  const [settings, setSettings] = useState<Record<CategoryKey, boolean>>(() => {
    if (typeof window === 'undefined') return { case: true, bmd: true, source: true, job: true, report: true }
    try {
      const saved = localStorage.getItem('pp-notif-settings')
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return { case: true, bmd: true, source: true, job: true, report: true }
  })
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    localStorage.setItem('pp-notif-settings', JSON.stringify(settings))
  }, [settings])

  const filteredNotifications = useMemo(
    () => notifications.filter((n) => settings[n.category as CategoryKey] ?? true),
    [notifications, settings],
  )
  const filteredUnread = filteredNotifications.filter((n) => !n.read).length

  const markAll = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications', { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success(lang === 'en' ? 'All marked as read' : 'সব পঠিত চিহ্নিত')
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      reload()
    },
  })

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      reload()
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" lang={lang}>{t.notifications.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredUnread} {lang === 'en' ? 'unread' : 'অপঠিত'} / {filteredNotifications.length} {lang === 'en' ? 'shown' : 'দেখানো'} · {notifications.length} {lang === 'en' ? 'total' : 'মোট'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showSettings ? 'default' : 'outline'}
            onClick={() => setShowSettings((v) => !v)}
            className="gap-1.5"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span lang={lang}>{lang === 'en' ? 'Filter' : 'ফিল্টার'}</span>
          </Button>
          {unread > 0 && (
            <Button size="sm" variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" />
              <span lang={lang}>{t.notifications.markAllRead}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category filter settings */}
      {showSettings && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" lang={lang}>
              <Settings2 className="h-4 w-4 text-primary" />
              {lang === 'en' ? 'Notification categories' : 'বিজ্ঞপ্তি বিভাগ'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((cat) => (
                <div key={cat} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-card">
                  <Label htmlFor={`cat-${cat}`} className="text-xs cursor-pointer flex-1" lang={lang}>
                    {lang === 'en' ? CATEGORY_LABELS[cat].en : CATEGORY_LABELS[cat].bn}
                  </Label>
                  <Switch
                    id={`cat-${cat}`}
                    checked={settings[cat]}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, [cat]: checked }))}
                  />
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground/70 mt-2" lang={lang}>
              {lang === 'en'
                ? 'Settings saved to this browser. Disabled categories are hidden from this view.'
                : 'এই ব্রাউজারে সংরক্ষিত। নিষ্ক্রিয় বিভাগ এই ভিউ থেকে লুকানো হয়।'}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground" lang={lang}>
              {notifications.length === 0
                ? t.notifications.empty
                : (lang === 'en' ? 'No notifications match your filter.' : 'আপনার ফিল্টারে কোনো বিজ্ঞপ্তি নেই।')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((n) => {
            const Icon =
              n.severity === 'error' ? AlertCircle : n.severity === 'warning' ? AlertTriangle : n.severity === 'success' ? CheckCircle2 : Info
            const color =
              n.severity === 'error'
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/30'
                : n.severity === 'warning'
                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                  : n.severity === 'success'
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'text-sky-600 bg-sky-50 dark:bg-sky-950/30'
            return (
              <Card key={n.id} className={!n.read ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="py-2.5 px-3 flex items-start gap-2.5">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="font-medium text-sm" lang={lang}>
                        {lang === 'en' ? n.titleEn : n.titleBn}
                      </div>
                      <SeverityBadge severity={n.severity} />
                      <Badge variant="outline" className="text-[9px] capitalize">{n.category}</Badge>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <div className="text-xs text-muted-foreground" lang={lang}>
                      {lang === 'en' ? n.bodyEn : n.bodyBn}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">{relativeTime(n.createdAt, lang)}</div>
                  </div>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markOne.mutate(n.id)} className="text-xs shrink-0">
                      {t.common.ack}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
