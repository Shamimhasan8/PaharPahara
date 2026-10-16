'use client'

// PaharPahara — Dashboard weather forecast mini-chart.
// Shows a compact 3-day forecast bar chart for the lead demo site (Chashma Hill).
// Uses the same /api/weather endpoint as the Preparedness view.

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, CloudRain } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'

interface Props {
  siteId: string
  siteName: string
  lang: Lang
}

export function DashboardForecastChart({ siteId, siteName, lang }: Props) {
  const t = dict[lang]

  const { data, isLoading } = useQuery<{
    intervals: Array<{ source: string; intervalStart: string; intervalEnd: string; valueMm: number; isForecast: boolean; isComplete: boolean }>
    totals: Record<string, { totalMm: number; complete: boolean; asOf: string | null }>
  }>({
    queryKey: ['weather', siteId],
    queryFn: async () => {
      const res = await fetch(`/api/weather?siteId=${siteId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    refetchInterval: 60 * 1000,
  })

  // Group forecast intervals into 24h windows (next 3 days)
  const chartData = (() => {
    if (!data?.intervals) return []
    const forecast = data.intervals.filter((w) => w.source === 'open_meteo' && w.isForecast)
    if (forecast.length === 0) return []

    // Group by day
    const byDay: Record<string, number> = {}
    for (const w of forecast) {
      const day = new Date(w.intervalStart).toISOString().slice(0, 10)
      byDay[day] = (byDay[day] ?? 0) + w.valueMm
    }

    return Object.entries(byDay)
      .slice(0, 3) // next 3 days
      .map(([day, mm]) => ({
        label: new Date(day + 'T00:00:00Z').toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
          weekday: 'short',
          day: '2-digit',
          timeZone: 'Asia/Dhaka',
        }),
        mm,
        overThreshold: mm >= 100,
      }))
  })()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2" lang={lang}>
          <CloudRain className="h-3.5 w-3.5 text-primary" />
          {lang === 'en' ? '3-day forecast' : '৩-দিন পূর্বাভাস'}
        </CardTitle>
        <CardDescription className="text-[10px]">
          {siteName} · Open-Meteo GFS
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center">
        {isLoading ? (
          <div className="flex items-center justify-center w-full py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8" lang={lang}>
            {lang === 'en' ? 'No forecast data.' : 'কোনো পূর্বাভাস ডেটা নেই।'}
          </div>
        ) : (
          <div className="w-full" style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 150)" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="oklch(0.50 0.02 150)" />
                <YAxis tick={{ fontSize: 9 }} stroke="oklch(0.50 0.02 150)" label={{ value: 'mm', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }} />
                <Tooltip
                  contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid oklch(0.85 0.02 150)' }}
                  formatter={(v: number) => [`${v.toFixed(1)} mm`, lang === 'en' ? 'Forecast' : 'পূর্বাভাস']}
                />
                <ReferenceLine y={100} stroke="oklch(0.55 0.20 25)" strokeDasharray="4 2" label={{ value: 'YPSA 100mm', fontSize: 8, fill: 'oklch(0.55 0.20 25)', position: 'insideTopRight' }} />
                <Bar dataKey="mm" name="mm" radius={[3, 3, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.overThreshold ? 'oklch(0.55 0.20 25)' : 'oklch(0.65 0.13 195)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
