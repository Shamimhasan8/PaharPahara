'use client'

// PaharPahara — Source health sparkline.
// Renders a 14-day mini trend chart per source adapter showing access-state history.

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Loader2 } from 'lucide-react'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { AccessStateBadge, relativeTime } from '@/components/pahar/badges'

interface Props {
  lang: Lang
}

interface HistoryPoint {
  date: string
  score: number
  state: string
}

interface SourceHistory {
  adapter: string
  currentAccessState: string
  lastCheckedAt: string | null
  points: HistoryPoint[]
}

const STATE_COLORS: Record<string, string> = {
  live: 'oklch(0.55 0.13 152)',
  historical_replay: 'oklch(0.65 0.13 195)',
  stale: 'oklch(0.75 0.16 75)',
  unavailable: 'oklch(0.55 0.20 25)',
}

export function SourceHealthSparklines({ lang }: Props) {
  const t = dict[lang]

  const { data, isLoading } = useQuery<{ history: SourceHistory[] }>({
    queryKey: ['source-health-history'],
    queryFn: async () => {
      const res = await fetch('/api/sources/health-history', { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    refetchInterval: 60 * 1000,
  })

  const history = data?.history ?? []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2" lang={lang}>
          <TrendingUp className="h-4 w-4 text-primary" />
          {lang === 'en' ? 'Source health trends (14 days)' : 'উৎস স্বাস্থ্য ট্রেন্ড (১৪ দিন)'}
        </CardTitle>
        <CardDescription className="text-xs" lang={lang}>
          {lang === 'en'
            ? 'Mini trend per adapter. Green = live, blue = replay, amber = stale, red = unavailable.'
            : 'প্রতি অ্যাডাপ্টারে মিনি ট্রেন্ড। সবুজ = লাইভ, নীল = রিপ্লে, অ্যাম্বার = পুরোনো, লাল = অনুপলব্ধ।'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground" lang={lang}>
            {lang === 'en' ? 'No history available.' : 'কোনো ইতিহাস নেই।'}
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.adapter} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <code className="text-[11px] font-mono font-medium truncate">{h.adapter}</code>
                    <AccessStateBadge state={h.currentAccessState} lang={lang} />
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {lang === 'en' ? 'Last checked' : 'সর্বশেষ যাচাই'}: {h.lastCheckedAt ? relativeTime(h.lastCheckedAt, lang) : '—'}
                  </div>
                </div>
                {/* Sparkline SVG */}
                <Sparkline points={h.points} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Sparkline({ points }: { points: HistoryPoint[] }) {
  if (points.length === 0) return null
  const width = 80
  const height = 24
  const stepX = width / (points.length - 1)
  const scoreToY = (score: number) => height - (score / 4) * (height - 4) - 2

  // Build path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${scoreToY(p.score)}`)
    .join(' ')

  // Build colored segments
  const segments: Array<{ d: string; color: string }> = []
  for (let i = 1; i < points.length; i++) {
    const x1 = (i - 1) * stepX
    const x2 = i * stepX
    const y1 = scoreToY(points[i - 1].score)
    const y2 = scoreToY(points[i].score)
    const color = STATE_COLORS[points[i].state] ?? STATE_COLORS.unavailable
    segments.push({ d: `M ${x1} ${y1} L ${x2} ${y2}`, color })
  }

  return (
    <svg width={width} height={height} className="shrink-0">
      {/* Baseline */}
      <line x1="0" y1={height - 2} x2={width} y2={height - 2} stroke="oklch(0.85 0.02 150)" strokeWidth="0.5" />
      {/* Colored segments */}
      {segments.map((s, i) => (
        <path key={i} d={s.d} stroke={s.color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ))}
      {/* Current state dot */}
      <circle
        cx={width}
        cy={scoreToY(points[points.length - 1].score)}
        r="2.5"
        fill={STATE_COLORS[points[points.length - 1].state] ?? STATE_COLORS.unavailable}
        stroke="white"
        strokeWidth="1"
      />
    </svg>
  )
}
