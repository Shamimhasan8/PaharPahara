'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert } from 'lucide-react'
import type { DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { AccessStateBadge, fmtDate, relativeTime } from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
}

export function SourcesView({ data, lang }: Props) {
  const t = dict[lang]
  const { sources } = data

  const live = sources.filter((s) => s.accessState === 'live').length
  const replay = sources.filter((s) => s.accessState === 'historical_replay').length
  const unavailable = sources.filter((s) => s.accessState === 'unavailable').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" lang={lang}>{t.sources.title}</h1>
        <p className="text-sm text-muted-foreground mt-1" lang={lang}>{t.sources.subtitle}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.status.live}</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{live}</div>
          </CardContent>
        </Card>
        <Card className="border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-800">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.status.historicalReplay}</div>
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">{replay}</div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-800">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.status.unavailable}</div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{unavailable}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{lang === 'en' ? 'Total adapters' : 'মোট অ্যাডাপ্টার'}</div>
            <div className="text-2xl font-bold">{sources.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" lang={lang}>{t.sources.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sources.map((s) => (
            <div key={s.id} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-xs font-semibold text-foreground font-mono">{s.adapter}</code>
                  <Badge variant="outline" className="text-[9px]">{s.version}</Badge>
                </div>
                <AccessStateBadge state={s.accessState} lang={lang} />
              </div>
              <div className="text-[11px] text-muted-foreground font-mono mb-1.5">{s.product}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div>
                  <span className="text-muted-foreground">{t.sources.lastChecked}:</span>{' '}
                  <span>{s.lastCheckedAt ? fmtDate(s.lastCheckedAt, lang) : '—'} ({relativeTime(s.lastCheckedAt, lang)})</span>
                </div>
              </div>
              {s.notes && (
                <div className="text-[11px] text-foreground/80 mt-1.5 italic">{s.notes}</div>
              )}
              <div className="text-[10px] text-muted-foreground/70 mt-1.5 border-t border-border/50 pt-1.5">
                {s.licence}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="py-3 px-4 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200" lang={lang}>
            {lang === 'en'
              ? 'A green service-health indicator never implies a hill is safe. UI real-time subscriptions update saved records; they do not make satellite acquisition or rainfall publication instantaneous.'
              : 'সবুজ সার্ভিস-স্বাস্থ্য সূচক কখনো পাহাড়ের নিরাপত্তা নিশ্চিত করে না। UI রিয়েল-টাইম সাবস্ক্রিপশন সংরক্ষিত রেকর্ড আপডেট করে; এটি স্যাটেলাইট অধিগ্রহণ বা বৃষ্টিপাত প্রকাশনা তাৎক্ষণিক করে না।'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
