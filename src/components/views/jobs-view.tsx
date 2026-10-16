'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2, CheckCircle2, Clock, RotateCw } from 'lucide-react'
import type { DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { JobStateBadge, fmtDate, relativeTime } from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
}

export function JobsView({ data, lang }: Props) {
  const t = dict[lang]
  const { jobs } = data

  const running = jobs.filter((j) => j.state === 'running').length
  const queued = jobs.filter((j) => j.state === 'queued').length
  const failed = jobs.filter((j) => j.state === 'failed').length
  const completed = jobs.filter((j) => j.state === 'completed').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" lang={lang}>{t.jobs.title}</h1>
        <p className="text-sm text-muted-foreground mt-1" lang={lang}>{t.jobs.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-sky-200 bg-sky-50/50 dark:bg-sky-950/20">
          <CardContent className="p-3 flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-sky-600 animate-spin" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">{t.status.running}</div>
              <div className="text-xl font-bold text-sky-700 dark:text-sky-300">{running}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/20">
          <CardContent className="p-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">{t.status.queued}</div>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300">{queued}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">{t.status.completed}</div>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{completed}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">{t.status.failed}</div>
              <div className="text-xl font-bold text-rose-700 dark:text-rose-300">{failed}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" lang={lang}>{t.jobs.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground" lang={lang}>{t.jobs.noJobs}</div>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="border border-border rounded-lg p-3 bg-card">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <code className="text-[11px] font-mono font-medium truncate">{j.jobKey}</code>
                  <JobStateBadge state={j.state} lang={lang} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground/80">{t.jobs.jobType}:</span> <code className="font-mono text-[10px]">{j.jobType}</code>
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">{t.jobs.attempts}:</span> {j.attempts}/{j.maxAttempts}
                    {j.attempts > 1 && <RotateCw className="inline h-3 w-3 ml-1 text-amber-500" />}
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">{t.jobs.lease}:</span> {j.leaseOwner ?? '—'}
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">{t.jobs.heartbeat}:</span>{' '}
                    {j.lastHeartbeat ? relativeTime(j.lastHeartbeat, lang) : '—'}
                  </div>
                  <div>
                    <span className="font-medium text-foreground/80">{lang === 'en' ? 'Updated' : 'আপডেট'}:</span> {fmtDate(j.updatedAt, lang)}
                  </div>
                </div>
                {j.error && (
                  <div className="mt-1.5 p-1.5 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-200 font-mono">
                    {j.error}
                  </div>
                )}
                {j.payloadJson && (
                  <details className="mt-1.5">
                    <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground" lang={lang}>
                      {t.jobs.payload}
                    </summary>
                    <pre className="mt-1 text-[10px] font-mono bg-muted/50 p-1.5 rounded overflow-x-auto">{j.payloadJson}</pre>
                  </details>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
