'use client'

// PaharPahara — Activity Feed widget.
// Shows a real-time stream of recent system events (case detections, job completions,
// BMD alerts, user sign-ins, etc.) aggregated from multiple sources.

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  CloudRain,
  Cog,
  ScrollText,
  Zap,
  Download,
  type LucideIcon,
} from 'lucide-react'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { relativeTime, fmtDate } from '@/components/pahar/badges'

interface FeedItem {
  id: string
  timestamp: string
  category: 'case' | 'job' | 'bmd' | 'source' | 'auth' | 'report' | 'system'
  action: string
  titleEn: string
  titleBn: string
  detailEn: string
  detailBn: string
  severity: 'info' | 'success' | 'warning' | 'error'
  actorName?: string | null
}

interface Props {
  lang: Lang
  height?: number
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  case: FileText,
  job: Cog,
  bmd: CloudRain,
  source: Activity,
  auth: User,
  report: ScrollText,
  system: Zap,
}

const SEVERITY_STYLES: Record<string, { icon: LucideIcon; bg: string; text: string }> = {
  info: { icon: Info, bg: 'bg-sky-100 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-300' },
  success: { icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-300' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-300' },
  error: { icon: AlertCircle, bg: 'bg-rose-100 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-300' },
}

export function ActivityFeed({ lang, height = 360 }: Props) {
  const t = dict[lang]
  const [filter, setFilter] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)

  const { data, isLoading } = useQuery<{ items: FeedItem[]; total: number }>({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const res = await fetch('/api/activity-feed?limit=40', { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    refetchInterval: 30 * 1000, // refresh every 30s
  })

  const items = data?.items ?? []
  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  )

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const i of items) m[i.category] = (m[i.category] ?? 0) + 1
    return m
  }, [items])

  const categories = ['all', 'case', 'job', 'bmd', 'auth', 'report']

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm" lang={lang}>{lang === 'en' ? 'Activity feed' : 'কার্যকলাপ ফিড'}</CardTitle>
              <CardDescription className="text-[10px]">{items.length} {lang === 'en' ? 'recent events' : 'সাম্প্রতিক ইভেন্ট'}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/api/activity-feed/export-csv', '_blank')}
              className="h-7 px-2 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              title={lang === 'en' ? 'Export as CSV' : 'CSV হিসেবে রপ্তানি'}
            >
              <Download className="h-3 w-3" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{lang === 'en' ? 'Live' : 'লাইভ'}</span>
            </div>
          </div>
        </div>
        {/* Category filters */}
        <div className="flex items-center gap-1 mt-1.5 overflow-x-auto scroll-thin pb-1">
          {categories.map((cat) => {
            const count = cat === 'all' ? items.length : categoryCounts[cat] ?? 0
            const labels: Record<string, string> = {
              all: lang === 'en' ? 'All' : 'সব',
              case: lang === 'en' ? 'Cases' : 'কেস',
              job: lang === 'en' ? 'Jobs' : 'জব',
              bmd: 'BMD',
              auth: lang === 'en' ? 'Auth' : 'অথ',
              report: lang === 'en' ? 'Reports' : 'রিপোর্ট',
            }
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap transition-colors ${
                  filter === cat
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {labels[cat]} <span className="opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-y-auto scroll-thin" style={{ maxHeight: height }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground" lang={lang}>
              {lang === 'en' ? 'No recent activity.' : 'কোনো সাম্প্রতিক কার্যকলাপ নেই।'}
            </div>
          ) : (
            <ol className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
              {filtered.map((item, idx) => {
                const sevStyle = SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.info
                const SevIcon = sevStyle.icon
                const CatIcon = CATEGORY_ICONS[item.category] ?? Activity
                return (
                  <li
                    key={item.id}
                    className="relative pl-10 pr-3 py-2 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Node on the timeline */}
                    <div className={`absolute left-2 top-2.5 h-4 w-4 rounded-full flex items-center justify-center ${sevStyle.bg} ring-2 ring-background`}>
                      <SevIcon className={`h-2.5 w-2.5 ${sevStyle.text}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <CatIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium truncate" lang={lang}>
                              {lang === 'en' ? item.titleEn : item.titleBn}
                            </span>
                          </div>
                          {item.detailEn && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate" lang={lang}>
                              {lang === 'en' ? item.detailEn : item.detailBn}
                            </div>
                          )}
                          <div className="text-[9px] text-muted-foreground/70 mt-0.5 flex items-center gap-1.5">
                            <span title={fmtDate(item.timestamp, lang)}>{relativeTime(item.timestamp, lang)}</span>
                            {item.actorName && (
                              <>
                                <span className="opacity-50">·</span>
                                <span className="truncate">{item.actorName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[8px] shrink-0 capitalize ${
                            item.severity === 'error'
                              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                              : item.severity === 'warning'
                                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                                : item.severity === 'success'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                  : 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300'
                          }`}
                        >
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </CardContent>

      {/* Item detail drawer */}
      {selectedItem && (
        <ActivityItemDrawer item={selectedItem} lang={lang} onClose={() => setSelectedItem(null)} />
      )}
    </Card>
  )
}

// Activity feed item detail drawer
function ActivityItemDrawer({ item, lang, onClose }: { item: FeedItem; lang: Lang; onClose: () => void }) {
  const sevStyle = SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.info
  const SevIcon = sevStyle.icon
  const CatIcon = CATEGORY_ICONS[item.category] ?? Activity

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${sevStyle.bg}`}>
              <SevIcon className={`h-4 w-4 ${sevStyle.text}`} />
            </div>
            <div>
              <div className="text-sm font-semibold" lang={lang}>
                {lang === 'en' ? item.titleEn : item.titleBn}
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <CatIcon className="h-2.5 w-2.5" />
                <span className="capitalize">{item.category}</span>
                <span className="opacity-50">·</span>
                <span>{relativeTime(item.timestamp, lang)}</span>
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">×</Button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-border rounded-lg p-2.5 bg-muted/30">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Timestamp</div>
              <div className="text-xs font-mono mt-0.5">{fmtDate(item.timestamp, lang)}</div>
            </div>
            <div className="border border-border rounded-lg p-2.5 bg-muted/30">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Severity</div>
              <div className={`text-xs font-medium mt-0.5 capitalize ${sevStyle.text}`}>{item.severity}</div>
            </div>
            <div className="border border-border rounded-lg p-2.5 bg-muted/30">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Action</div>
              <div className="text-xs font-mono mt-0.5">{item.action}</div>
            </div>
            <div className="border border-border rounded-lg p-2.5 bg-muted/30">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Actor</div>
              <div className="text-xs mt-0.5 truncate">{item.actorName ?? '—'}</div>
            </div>
          </div>
          {item.detailEn && (
            <div className="border border-border rounded-lg p-2.5 bg-muted/30">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Detail</div>
              <div className="text-xs break-all" lang={lang}>
                {lang === 'en' ? item.detailEn : item.detailBn}
              </div>
            </div>
          )}
          <div className="border border-border rounded-lg p-2.5 bg-muted/30">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Raw JSON</div>
            <pre className="text-[10px] font-mono overflow-x-auto scroll-thin">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
