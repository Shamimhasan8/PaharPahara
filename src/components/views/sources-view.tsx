'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ChevronDown, ChevronRight, Loader2, Fingerprint, Calendar, MapPin, Layers } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { AccessStateBadge, fmtDate, fmtDateOnly, relativeTime } from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
}

interface RawAssetDTO {
  id: string
  adapter: string
  product: string
  providerAssetId: string
  acquiredAt: string
  validStart: string
  validEnd: string
  retrievalTime: string
  grid: string | null
  qaStatus: string
  coveragePct: number | null
  fileUri: string
  sha256: string
  units: string | null
  licence: string
}

export function SourcesView({ data, lang }: Props) {
  const t = dict[lang]
  const { sources } = data
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const live = sources.filter((s) => s.accessState === 'live').length
  const replay = sources.filter((s) => s.accessState === 'historical_replay').length
  const unavailable = sources.filter((s) => s.accessState === 'unavailable').length
  const stale = sources.filter((s) => s.accessState === 'stale').length

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{live}</div>
          </CardContent>
        </Card>
        <Card className="border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-800">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.status.historicalReplay}</div>
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300 tabular-nums">{replay}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.status.stale}</div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">{stale}</div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-800">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.status.unavailable}</div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300 tabular-nums">{unavailable}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" lang={lang}>{t.sources.title}</CardTitle>
          <CardDescription className="text-xs" lang={lang}>
            {lang === 'en' ? 'Click any adapter to inspect its raw assets.' : 'কাঁচা অ্যাসেট পরিদর্শন করতে যেকোনো অ্যাডাপ্টারে ক্লিক করুন।'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sources.map((s) => (
            <SourceRow
              key={s.id}
              source={s}
              lang={lang}
              expanded={expanded.has(s.id)}
              onToggle={() => toggle(s.id)}
            />
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

function SourceRow({
  source,
  lang,
  expanded,
  onToggle,
}: {
  source: DashboardDataDTO['sources'][number]
  lang: Lang
  expanded: boolean
  onToggle: () => void
}) {
  const t = dict[lang]

  const { data, isLoading } = useQuery<{ assets: RawAssetDTO[] }>({
    queryKey: ['source-assets', source.id],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${source.id}/assets`, { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    enabled: expanded,
    staleTime: 60 * 1000,
  })

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full text-left p-3 hover:bg-muted/40 transition-colors flex items-start gap-3"
      >
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <code className="text-xs font-semibold text-foreground font-mono truncate">{source.adapter}</code>
              <Badge variant="outline" className="text-[9px] shrink-0">{source.version}</Badge>
            </div>
            <AccessStateBadge state={source.accessState} lang={lang} />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mb-1.5 truncate">{source.product}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
            <div>
              <span className="text-muted-foreground">{t.sources.lastChecked}:</span>{' '}
              <span>{source.lastCheckedAt ? `${fmtDate(source.lastCheckedAt, lang)} (${relativeTime(source.lastCheckedAt, lang)})` : '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{lang === 'en' ? 'Assets' : 'অ্যাসেট'}:</span>{' '}
              <span className="font-medium">{expanded ? (data?.assets.length ?? '…') : (lang === 'en' ? 'Click to load' : 'দেখতে ক্লিক করুন')}</span>
            </div>
          </div>
          {source.notes && (
            <div className="text-[11px] text-foreground/80 mt-1.5 italic line-clamp-2">{source.notes}</div>
          )}
          <div className="text-[10px] text-muted-foreground/70 mt-1.5 border-t border-border/50 pt-1.5 line-clamp-1">
            {source.licence}
          </div>
        </div>
      </button>

      {/* Expanded assets */}
      {expanded && (
        <div className="border-t border-border bg-muted/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : (data?.assets.length ?? 0) === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-6" lang={lang}>
              {lang === 'en' ? 'No raw assets for this adapter.' : 'এই অ্যাডাপ্টারের জন্য কোনো কাঁচা অ্যাসেট নেই।'}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {data?.assets.map((a) => (
                <div key={a.id} className="p-3 hover:bg-card/40 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <code className="text-[11px] font-mono font-medium text-foreground truncate">{a.providerAssetId}</code>
                    <Badge
                      variant="outline"
                      className={`text-[9px] shrink-0 ${
                        a.qaStatus === 'ok'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : a.qaStatus === 'partial'
                            ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                            : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                      }`}
                    >
                      {a.qaStatus}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {fmtDateOnly(a.acquiredAt, lang)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {a.grid ?? '—'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="h-2.5 w-2.5" />
                      {a.coveragePct != null ? `${a.coveragePct.toFixed(0)}%` : '—'}
                    </div>
                    <div className="flex items-center gap-1 font-mono truncate">
                      <Fingerprint className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{a.sha256.slice(0, 12)}…</span>
                    </div>
                  </div>
                  {a.units && (
                    <div className="text-[9px] text-muted-foreground/60 mt-1 italic">{a.units}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
