'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react'
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

export function NotificationsView({ data, lang, reload }: Props) {
  const t = dict[lang]
  const qc = useQueryClient()
  const { notifications } = data
  const unread = notifications.filter((n) => !n.read).length

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" lang={lang}>{t.notifications.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unread} {lang === 'en' ? 'unread' : 'অপঠিত'} / {notifications.length} {lang === 'en' ? 'total' : 'মোট'}
          </p>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="gap-1.5">
            <CheckCheck className="h-3.5 w-3.5" />
            <span lang={lang}>{t.notifications.markAllRead}</span>
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground" lang={lang}>{t.notifications.empty}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
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
