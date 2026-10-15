'use client'

// Shared status badges, access-state pills, and small utility components.

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'

export function AccessStateBadge({ state, lang }: { state: string; lang: Lang }) {
  const t = dict[lang]
  const styles: Record<string, string> = {
    live: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
    stale: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
    historical_replay: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900',
    unavailable: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
  }
  const labels: Record<string, string> = {
    live: t.status.live,
    stale: t.status.stale,
    historical_replay: t.status.historicalReplay,
    unavailable: t.status.unavailable,
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', styles[state] ?? styles.unavailable)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', state === 'live' ? 'bg-emerald-500 animate-pulse' : state === 'stale' ? 'bg-amber-500' : state === 'historical_replay' ? 'bg-sky-500' : 'bg-rose-500')} />
      {labels[state] ?? state}
    </span>
  )
}

export function CaseStatusBadge({ status, lang }: { status: string; lang: Lang }) {
  const t = dict[lang]
  const styles: Record<string, string> = {
    candidate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    under_review: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
    field_verification: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-300',
    reviewed: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300',
    field_corroborated: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300',
  }
  const labels: Record<string, string> = {
    candidate: t.status.candidate,
    under_review: t.status.underReview,
    field_verification: t.status.fieldVerification,
    reviewed: t.status.reviewed,
    rejected: t.status.rejected,
    field_corroborated: t.status.fieldCorroborated,
  }
  return (
    <Badge variant="outline" className={cn('text-[10px] font-medium', styles[status] ?? styles.candidate)}>
      {labels[status] ?? status.replace(/_/g, ' ')}
    </Badge>
  )
}

export function JobStateBadge({ state, lang }: { state: string; lang: Lang }) {
  const t = dict[lang]
  const styles: Record<string, string> = {
    queued: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    running: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 animate-pulse',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
    failed: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300',
    retry: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  }
  const labels: Record<string, string> = {
    queued: t.status.queued,
    running: t.status.running,
    completed: t.status.completed,
    failed: t.status.failed,
    retry: t.status.retry,
  }
  return (
    <Badge variant="outline" className={cn('text-[10px] font-medium', styles[state] ?? styles.queued)}>
      {labels[state] ?? state}
    </Badge>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    info: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
    error: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize', styles[severity] ?? styles.info)}>
      {severity}
    </span>
  )
}

export function JurisdictionBadge({ jurisdiction, lang }: { jurisdiction: string; lang: Lang }) {
  const t = dict[lang]
  const styles: Record<string, string> = {
    verified_doe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    verified_forest: 'bg-teal-50 text-teal-700 border-teal-200',
    unverified: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  const labels: Record<string, string> = {
    verified_doe: t.site.verifiedDoe,
    verified_forest: t.site.verifiedForest,
    unverified: t.site.unverified,
  }
  return (
    <Badge variant="outline" className={cn('text-[10px] font-medium', styles[jurisdiction] ?? styles.unverified)}>
      {labels[jurisdiction] ?? jurisdiction}
    </Badge>
  )
}

export function fmtDate(dateStr: string | null | undefined, lang: Lang, opts?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dhaka',
    ...opts,
  })
}

export function fmtDateOnly(dateStr: string | null | undefined, lang: Lang) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'Asia/Dhaka',
  })
}

export function relativeTime(dateStr: string | null | undefined, lang: Lang) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  const rtf = new Intl.RelativeTimeFormat(lang === 'bn' ? 'bn-BD' : 'en', { numeric: 'auto' })
  if (day > 0) return rtf.format(-day, 'day')
  if (hr > 0) return rtf.format(-hr, 'hour')
  if (min > 0) return rtf.format(-min, 'minute')
  return rtf.format(-sec, 'second')
}
