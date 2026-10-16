'use client'

// PaharPahara — Audit Log view (admin only).
// Surfaces the AuditLog table: who did what, when, on what target.

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollText, Search, Download, User, ShieldCheck, AlertCircle, FileText, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { Lang, Role } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { fmtDate, relativeTime } from '@/components/pahar/badges'

interface AuditLogDTO {
  id: string
  actorId: string | null
  actorName: string | null
  actorEmail: string | null
  actorRole: string | null
  action: string
  target: string | null
  detailJson: string | null
  ipAddress: string | null
  createdAt: string
}

const ACTION_META: Record<string, { icon: typeof User; tone: 'info' | 'success' | 'warning' | 'error' }> = {
  user_signin: { icon: User, tone: 'info' },
  user_signout: { icon: User, tone: 'info' },
  case_reviewed: { icon: ShieldCheck, tone: 'success' },
  case_status_changed: { icon: ShieldCheck, tone: 'info' },
  case_opened: { icon: FileText, tone: 'info' },
  report_requested: { icon: FileText, tone: 'info' },
  notification_sent: { icon: AlertCircle, tone: 'info' },
  seed_completed: { icon: ScrollText, tone: 'info' },
}

const TONE_COLORS: Record<string, string> = {
  info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  error: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
}

interface Props {
  lang: Lang
  role: Role
}

export function AuditLogView({ lang, role }: Props) {
  const t = dict[lang]
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')

  const { data, isLoading, refetch, isFetching } = useQuery<{ logs: AuditLogDTO[] }>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await fetch('/api/audit?limit=200', { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    refetchInterval: 30 * 1000,
  })

  const logs = data?.logs ?? []

  // Distinct actions for the filter dropdown
  const distinctActions = useMemo(() => {
    const s = new Set<string>()
    for (const l of logs) s.add(l.action)
    return Array.from(s).sort()
  }, [logs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter((l) => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false
      if (!q) return true
      return (
        l.action.toLowerCase().includes(q) ||
        l.actorName?.toLowerCase().includes(q) ||
        l.actorEmail?.toLowerCase().includes(q) ||
        l.target?.toLowerCase().includes(q) ||
        l.detailJson?.toLowerCase().includes(q)
      )
    })
  }, [logs, query, actionFilter])

  const downloadCsv = () => {
    const rows = [
      ['id', 'createdAt', 'actorName', 'actorEmail', 'actorRole', 'action', 'target', 'detail'],
      ...filtered.map((l) => [
        l.id,
        l.createdAt,
        l.actorName ?? '',
        l.actorEmail ?? '',
        l.actorRole ?? '',
        l.action,
        l.target ?? '',
        l.detailJson ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paharpahara-audit-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShieldCheck className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground" lang={lang}>
            {lang === 'en' ? 'Admin role required to view the audit log.' : 'অডিট লগ দেখতে অ্যাডমিন ভূমিকা প্রয়োজন।'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" lang={lang}>
            <ScrollText className="h-6 w-6 text-primary" />
            {t.nav.audit}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" lang={lang}>
            {lang === 'en'
              ? 'Immutable record of every reviewer action — sign-in, case review, report request.'
              : 'প্রতিটি পর্যালোচক কর্মের অপরিবর্তনীয় রেকর্ড — সাইন-ইন, কেস পর্যালোচনা, রিপোর্ট অনুরোধ।'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span lang={lang}>{t.common.refresh}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCsv} disabled={filtered.length === 0} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span lang={lang}>{lang === 'en' ? 'Export CSV' : 'CSV রপ্তানি'}</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === 'en' ? 'Search by user, action, target…' : 'ব্যবহারকারী, কর্ম, লক্ষ্য দিয়ে খুঁজুন…'}
                className="pl-8 text-xs h-9"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 px-2 text-xs rounded-md border border-border bg-card"
            >
              <option value="all">{lang === 'en' ? 'All actions' : 'সব কর্ম'} ({logs.length})</option>
              {distinctActions.map((a) => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')} ({logs.filter((l) => l.action === a).length})</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase">{lang === 'en' ? 'Total events' : 'মোট ইভেন্ট'}</div>
            <div className="text-2xl font-bold tabular-nums">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase">{lang === 'en' ? 'Sign-ins' : 'সাইন-ইন'}</div>
            <div className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-300">{logs.filter((l) => l.action === 'user_signin').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase">{lang === 'en' ? 'Case reviews' : 'কেস পর্যালোচনা'}</div>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-300">{logs.filter((l) => l.action === 'case_reviewed').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase">{lang === 'en' ? 'Reports requested' : 'রিপোর্ট অনুরোধ'}</div>
            <div className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-300">{logs.filter((l) => l.action === 'report_requested').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Log entries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" lang={lang}>{lang === 'en' ? 'Event stream' : 'ইভেন্ট স্ট্রিম'}</CardTitle>
          <CardDescription className="text-xs" lang={lang}>
            {filtered.length} {lang === 'en' ? 'of' : 'এর মধ্যে'} {logs.length} {lang === 'en' ? 'events' : 'ইভেন্ট'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground" lang={lang}>
              {lang === 'en' ? 'No audit log entries match this filter.' : 'এই ফিল্টারে কোনো অডিট লগ এন্ট্রি নেই।'}
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto scroll-thin divide-y divide-border">
              {filtered.map((l) => {
                const meta = ACTION_META[l.action] ?? { icon: ScrollText, tone: 'info' as const }
                const Icon = meta.icon
                const detail = l.detailJson ? (() => { try { return JSON.parse(l.detailJson) } catch { return null } })() : null
                return (
                  <div key={l.id} className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${TONE_COLORS[meta.tone]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium capitalize">{l.action.replace(/_/g, ' ')}</span>
                        <Badge variant="outline" className={`text-[9px] ${TONE_COLORS[meta.tone]}`}>{meta.tone}</Badge>
                        {l.target && (
                          <code className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{l.target}</code>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {l.actorName ?? (lang === 'en' ? 'System' : 'সিস্টেম')}
                        {l.actorRole && <span className="opacity-70"> ({l.actorRole.replace(/_/g, ' ')})</span>}
                        {' · '}
                        {fmtDate(l.createdAt, lang)}
                        {' · '}
                        {relativeTime(l.createdAt, lang)}
                      </div>
                      {detail && (
                        <details className="mt-1">
                          <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground" lang={lang}>
                            {lang === 'en' ? 'Detail' : 'বিস্তারিত'}
                          </summary>
                          <pre className="mt-1 text-[10px] font-mono bg-muted/40 p-1.5 rounded overflow-x-auto">{JSON.stringify(detail, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
