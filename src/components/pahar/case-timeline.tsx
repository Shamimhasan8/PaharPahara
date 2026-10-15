'use client'

// PaharPahara — Case Timeline visualization.
// Renders the case lifecycle as a horizontal timeline showing each status
// transition with timestamps, derived from the review history.

import { useMemo } from 'react'
import type { CaseDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { fmtDate, relativeTime } from '@/components/pahar/badges'

interface Props {
  c: CaseDTO
  lang: Lang
}

// The canonical workflow stages in order.
const STAGES = [
  'candidate',
  'under_review',
  'field_verification',
  'field_corroborated',
  'reviewed',
] as const

type Stage = (typeof STAGES)[number]

// Map a review-history action to the resulting status.
function actionToStatus(action: string, toStatus: string | null): string | null {
  if (action === 'opened') return 'candidate'
  if (action === 'status_changed' || action === 'reviewed') return toStatus
  if (action === 'report_requested') return toStatus
  return toStatus
}

const STAGE_LABELS_EN: Record<string, string> = {
  candidate: 'Candidate',
  under_review: 'Under review',
  field_verification: 'Field verification',
  field_corroborated: 'Field corroborated',
  reviewed: 'Reviewed',
}

const STAGE_LABELS_BN: Record<string, string> = {
  candidate: 'প্রার্থী',
  under_review: 'পর্যালোচনাধীন',
  field_verification: 'ফিল্ড যাচাই',
  field_corroborated: 'ফিল্ড-করোবোরেটেড',
  reviewed: 'পর্যালোচিত',
}

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  candidate: { bg: 'bg-slate-100 dark:bg-slate-800/40', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  under_review: { bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  field_verification: { bg: 'bg-violet-100 dark:bg-violet-950/40', border: 'border-violet-300 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  field_corroborated: { bg: 'bg-teal-100 dark:bg-teal-950/40', border: 'border-teal-300 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  reviewed: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  rejected: { bg: 'bg-rose-100 dark:bg-rose-950/40', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
}

export function CaseTimeline({ c, lang }: Props) {
  const t = dict[lang]

  // Derive stage events from review history: each "opened" or "status_changed" is a stage entry
  const events = useMemo(() => {
    const evts: Array<{ status: string; at: string; actor: string; note: string | null; action: string }> = []
    for (const h of c.reviewHistory) {
      const status = actionToStatus(h.action, h.toStatus)
      if (status) {
        evts.push({
          status,
          at: h.createdAt,
          actor: h.actorName,
          note: h.note,
          action: h.action,
        })
      }
    }
    return evts
  }, [c.reviewHistory])

  // Determine the current stage + which stages have been visited
  const currentStatus = c.status
  const visitedStages = useMemo(() => {
    const s = new Set<string>()
    s.add('candidate') // always starts here
    for (const e of events) s.add(e.status)
    return s
  }, [events])

  // Stage events mapped by status (latest event per status)
  const stageEvents = useMemo(() => {
    const m: Record<string, typeof events[number] | undefined> = {}
    for (const e of events) {
      m[e.status] = e // later events overwrite (last one wins, but events are in chrono order)
    }
    return m
  }, [events])

  // If rejected, show as a separate end-state
  const isRejected = currentStatus === 'rejected'

  return (
    <div className="space-y-3">
      {/* Horizontal stage timeline (desktop) */}
      <div className="hidden sm:block overflow-x-auto scroll-thin pb-2">
        <div className="flex items-center min-w-max gap-0 px-1">
          {STAGES.map((stage, idx) => {
            const visited = visitedStages.has(stage)
            const isCurrent = currentStatus === stage
            const isPast = STAGES.indexOf(currentStatus as Stage) > idx && visited
            const ev = stageEvents[stage]
            const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.candidate

            return (
              <div key={stage} className="flex items-center">
                {/* Stage node */}
                <div className="flex flex-col items-center gap-1.5 min-w-[110px]">
                  <div
                    className={`relative h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCurrent
                        ? `${colors.border} ${colors.bg} shadow-md scale-110`
                        : visited
                          ? `${colors.border} ${colors.bg}`
                          : 'border-border bg-card'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: 'currentColor' }} />
                    )}
                    {visited ? (
                      <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-[10px] font-medium ${isCurrent ? colors.text : visited ? 'text-foreground/80' : 'text-muted-foreground/50'}`}>
                      {lang === 'en' ? STAGE_LABELS_EN[stage] : STAGE_LABELS_BN[stage]}
                    </div>
                    {ev && (
                      <div className="text-[8.5px] text-muted-foreground/70 mt-0.5">
                        {relativeTime(ev.at, lang)}
                      </div>
                    )}
                  </div>
                </div>
                {/* Connector */}
                {idx < STAGES.length - 1 && (
                  <div className="flex-shrink-0 mx-1">
                    <div
                      className={`h-0.5 w-8 ${
                        visited && visitedStages.has(STAGES[idx + 1])
                          ? 'bg-primary/60'
                          : visited
                            ? 'bg-primary/30'
                            : 'bg-border'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
          {/* Rejected end-state (horizontal) */}
          {isRejected && (
            <>
              <div className="flex-shrink-0 mx-1">
                <div className="h-0.5 w-8 bg-rose-300 dark:bg-rose-700" />
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-[110px]">
                <div className="h-7 w-7 rounded-full flex items-center justify-center border-2 border-rose-300 bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 shadow-md scale-110">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-medium text-rose-700 dark:text-rose-300">
                    {lang === 'en' ? 'Rejected' : 'প্রত্যাখ্যাত'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Vertical stage timeline (mobile) */}
      <div className="sm:hidden">
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
          {STAGES.map((stage, idx) => {
            const visited = visitedStages.has(stage)
            const isCurrent = currentStatus === stage
            const ev = stageEvents[stage]
            const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.candidate
            return (
              <div key={stage} className="relative pb-3 last:pb-0">
                {/* Node */}
                <div
                  className={`absolute left-[-14px] top-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCurrent
                      ? `${colors.border} ${colors.bg} shadow-md`
                      : visited
                        ? `${colors.border} ${colors.bg}`
                        : 'border-border bg-card'
                  }`}
                >
                  {visited ? (
                    <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                {/* Label */}
                <div className="ml-2">
                  <div className={`text-[11px] font-medium ${isCurrent ? colors.text : visited ? 'text-foreground/80' : 'text-muted-foreground/50'}`}>
                    {lang === 'en' ? STAGE_LABELS_EN[stage] : STAGE_LABELS_BN[stage]}
                  </div>
                  {ev && (
                    <div className="text-[9px] text-muted-foreground/70">
                      {relativeTime(ev.at, lang)} · {ev.actor}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {/* Rejected end-state (mobile vertical) */}
          {isRejected && (
            <div className="relative pb-3 last:pb-0">
              <div className="absolute left-[-14px] top-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 border-rose-300 bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 shadow-md">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
              </div>
              <div className="ml-2">
                <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                  {lang === 'en' ? 'Rejected' : 'প্রত্যাখ্যাত'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event log */}
      <div className="border-t border-border pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2" lang={lang}>
          {lang === 'en' ? 'Event log' : 'ইভেন্ট লগ'}
        </div>
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto scroll-thin">
          {events.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2" lang={lang}>
              {lang === 'en' ? 'No events recorded.' : 'কোনো ইভেন্ট রেকর্ড করা হয়নি।'}
            </div>
          ) : (
            events.map((e, idx) => {
              const colors = STAGE_COLORS[e.status] ?? STAGE_COLORS.candidate
              return (
                <div key={idx} className="flex items-start gap-2 text-[11px] py-1">
                  <span className={`h-2 w-2 rounded-full mt-1 shrink-0 ${colors.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-medium capitalize ${colors.text}`}>
                        {lang === 'en' ? STAGE_LABELS_EN[e.status] : STAGE_LABELS_BN[e.status]}
                      </span>
                      <span className="text-muted-foreground/60">·</span>
                      <span className="text-muted-foreground">{e.actor}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/80">
                      {fmtDate(e.at, lang)}
                    </div>
                    {e.note && (
                      <div className="text-[10px] text-foreground/70 mt-0.5 italic leading-tight">{e.note}</div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
