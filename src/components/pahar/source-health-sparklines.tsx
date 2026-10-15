'use client'

// PaharPahara — Source health sparkline.
// Renders a 14-day mini trend chart per source adapter showing access-state history.

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
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
      <CardContent className="flex-1 overflow-y-auto scroll-thin">
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
  const [hover, setHover] = useState<number | null>(null)
  if (points.length === 0) return null
  const width = 80
  const height = 24
  const stepX = width / (points.length - 1)
  const scoreToY = (score: number) => height - (score / 4) * (height - 4) - 2

  // Build colored segments
  const segments: Array<{ d: string; color: string; idx: number }> = []
  for (let i = 1; i < points.length; i++) {
    const x1 = (i - 1) * stepX
    const x2 = i * stepX
    const y1 = scoreToY(points[i - 1].score)
    const y2 = scoreToY(points[i].score)
    const color = STATE_COLORS[points[i].state] ?? STATE_COLORS.unavailable
    segments.push({ d: `M ${x1} ${y1} L ${x2} ${y2}`, color, idx: i })
  }

  const lastPoint = points[points.length - 1]
  const hoverPoint = hover != null ? points[hover] : null

  return (
    <div className="relative shrink-0">
      <svg
        width={width}
        height={height}
        className="shrink-0"
        onMouseLeave={() => setHover(null)}
      >
        {/* Baseline */}
        <line x1="0" y1={height - 2} x2={width} y2={height - 2} stroke="oklch(0.85 0.02 150)" strokeWidth="0.5" />
        {/* Colored segments */}
        {segments.map((s) => (
          <path
            key={s.idx}
            d={s.d}
            stroke={s.color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {/* Hover hit areas (invisible rectangles per data point) */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={i * stepX - stepX / 2}
            y={0}
            width={stepX}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        {/* Current state dot */}
        <circle
          cx={width}
          cy={scoreToY(lastPoint.score)}
          r="2.5"
          fill={STATE_COLORS[lastPoint.state] ?? STATE_COLORS.unavailable}
          stroke="white"
          strokeWidth="1"
        />
        {/* Hover indicator */}
        {hover != null && hoverPoint && (
          <circle
            cx={hover * stepX}
            cy={scoreToY(hoverPoint.score)}
            r="3"
            fill="white"
            stroke={STATE_COLORS[hoverPoint.state] ?? STATE_COLORS.unavailable}
            strokeWidth="1.5"
          />
        )}
      </svg>
      {/* Tooltip */}
      {hover != null && hoverPoint && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-foreground text-background text-[8px] font-mono whitespace-nowrap pointer-events-none z-10">
          {hoverPoint.date}: {hoverPoint.state.replace(/_/g, ' ')}
        </div>
      )}
    </div>
  )
}
