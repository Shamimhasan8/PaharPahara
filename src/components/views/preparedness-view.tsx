'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ShieldAlert, CloudRain, TrendingUp, Info } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import type { DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { fmtDate, fmtDateOnly } from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
}

export function PreparednessView({ data, lang }: Props) {
  const t = dict[lang]
  const { sites, bulletins, rainfallSummary } = data

  // Fetch weather for the Chashma site (lead demo site)
  const chashma = sites.find((s) => s.slug === 'chashma-hill') ?? sites[0]
  const { data: weather, isLoading } = useQuery({
    queryKey: ['weather', chashma?.id],
    queryFn: async () => {
      const res = await fetch(`/api/weather?siteId=${chashma.id}`, { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json() as Promise<{
        intervals: Array<{ id: string; source: string; intervalStart: string; intervalEnd: string; valueMm: number; isForecast: boolean; isComplete: boolean }>
        totals: Record<string, { totalMm: number; complete: boolean; asOf: string | null; expected: number; actual: number }>
      }>
    },
    enabled: !!chashma?.id,
  })

  // Aggregate observed IMERG and forecast for combined chart
  const observedHourly = (weather?.intervals ?? [])
    .filter((w) => w.source === 'imerg_early')
    .reduce((acc: Array<{ time: string; mm: number; complete: boolean }>, w) => {
      const d = new Date(w.intervalStart)
      const hourKey = d.toISOString().slice(0, 13)
      const existing = acc.find((a) => a.time === hourKey)
      const value = w.isComplete ? w.valueMm : 0
      if (existing) {
        existing.mm += value
        existing.complete = existing.complete && w.isComplete
      } else {
        acc.push({ time: hourKey, mm: value, complete: w.isComplete })
      }
      return acc
    }, [])
    .map((d) => ({
      label: new Date(d.time + ':00:00Z').toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        timeZone: 'Asia/Dhaka',
      }),
      mm: d.mm,
      complete: d.complete,
      kind: 'observed' as const,
    }))

  const forecastHourly = (weather?.intervals ?? [])
    .filter((w) => w.source === 'open_meteo' && w.isForecast)
    .map((w) => ({
      label: new Date(w.intervalStart).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        timeZone: 'Asia/Dhaka',
      }),
      mm: w.valueMm,
      complete: true,
      kind: 'forecast' as const,
    }))

  const combined = [...observedHourly, ...forecastHourly]
  // YPSA threshold: 100 mm/24h
  const ypsaThreshold = 100 / 24 // per-hour average to hit 100mm in 24h

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" lang={lang}>{t.preparedness.title}</h1>
        <p className="text-sm text-muted-foreground mt-1" lang={lang}>{t.preparedness.subtitle}</p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="py-3 px-4 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200" lang={lang}>{t.preparedness.note}</div>
        </CardContent>
      </Card>

      {/* BMD bulletins */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {t.preparedness.bmdHeading}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bulletins.map((b) => (
            <div key={b.id} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-medium text-sm" lang={lang}>
                  {lang === 'en' ? b.headlineEn : b.headlineBn}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-[9px] capitalize">{b.messageType}</Badge>
                  {b.hasValidityConflict && (
                    <Badge variant="outline" className="text-[9px] bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                      {lang === 'en' ? 'CONFLICT' : 'অমিল'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground" lang={lang}>
                {lang === 'en' ? 'Sent' : 'প্রেরিত'}: {fmtDate(b.sentAt, lang)}
                {b.expiresAt && <> • {lang === 'en' ? 'XML expires' : 'XML মেয়াদ'}: {fmtDate(b.expiresAt, lang)}</>}
              </div>
              {b.hasValidityConflict && (
                <div className="mt-1.5 p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-200">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  <strong>{lang === 'en' ? 'Validity conflict — human review required:' : 'বৈধতা অমিল — মানব পর্যালোচনা প্রয়োজন:'}</strong>{' '}
                  {lang === 'en'
                    ? `XML expires ${fmtDateOnly(b.expiresAt, lang)} but text describes 72h from ${fmtDateOnly(b.textEffectiveStart, lang)} → ${fmtDateOnly(b.textEffectiveEnd, lang)}.`
                    : `XML মেয়াদ ${fmtDateOnly(b.expiresAt, lang)} কিন্তু টেক্সট ${fmtDateOnly(b.textEffectiveStart, lang)} থেকে ৭২ঘা উল্লেখ করে → ${fmtDateOnly(b.textEffectiveEnd, lang)}।`}
                </div>
              )}
              <div className="text-xs text-foreground/80 mt-1.5" lang={lang}>
                {lang === 'en' ? b.descriptionEn : b.descriptionBn}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 font-mono">CAP ID: {b.capIdentifier}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rainfall summary cards across all sites */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <CloudRain className="h-4 w-4 text-primary" />
            {t.preparedness.rainfallHeading}
          </CardTitle>
          <CardDescription className="text-xs">
            {lang === 'en'
              ? 'Completeness-aware totals. "Incomplete" means missing IMERG intervals — never silently filled with zero.'
              : 'সম্পূর্ণতা-সচেতন মোট। "অসম্পূর্ণ" মানে অনুপস্থিত IMERG ব্যবধান — কখনো নীরবে শূন্য দিয়ে পূরণ হয় না।'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sites.map((s) => {
              const r = rainfallSummary[s.id]
              const ypsaTrigger = 100 // mm/24h
              const overTrigger = (r?.total24h ?? 0) >= ypsaTrigger
              return (
                <div key={s.id} className={`border rounded-lg p-3 ${overTrigger ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800' : 'border-border bg-card'}`}>
                  <div className="font-medium text-sm" lang={lang}>{lang === 'en' ? s.nameEn : s.nameBn}</div>
                  <div className="text-[10px] text-muted-foreground">{s.district}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">24h</div>
                      <div className={`font-bold ${overTrigger ? 'text-rose-700 dark:text-rose-300' : ''}`}>{r?.total24h.toFixed(1) ?? '—'} mm</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">72h</div>
                      <div className="font-bold">{r?.total72h.toFixed(1) ?? '—'} mm</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {r?.complete ? (
                      <Badge variant="outline" className="text-[9px] bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
                        {lang === 'en' ? 'Complete' : 'সম্পূর্ণ'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
                        {t.dashboard.incompleteData}
                      </Badge>
                    )}
                    {r?.asOf && <span className="text-[10px] text-muted-foreground">{fmtDateOnly(r.asOf, lang)}</span>}
                  </div>
                  {overTrigger && (
                    <div className="mt-1.5 text-[10px] text-rose-700 dark:text-rose-300 font-medium" lang={lang}>
                      {lang === 'en' ? 'YPSA 100 mm/24h comparison crossed' : 'YPSA ১০০ মিমি/২৪ঘা তুলনা অতিক্রান্ত'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Combined observed + forecast chart */}
      {chashma && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" lang={lang}>
              <TrendingUp className="h-4 w-4 text-primary" />
              {t.preparedness.forecastHeading} — {lang === 'en' ? chashma.nameEn : chashma.nameBn}
            </CardTitle>
            <CardDescription className="text-xs">
              {lang === 'en'
                ? 'Observed (IMERG, blue) + Forecast (Open-Meteo GFS, teal). Yellow = missing intervals. YPSA 100mm/24h equivalent line shown.'
                : 'পর্যবেক্ষিত (IMERG, নীল) + পূর্বাভাস (Open-Meteo GFS, টিল)। হলুদ = অনুপস্থিত ব্যবধান। YPSA ১০০মিমি/২৪ঘা সমতুল্য রেখা দেখানো।'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[280px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : combined.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground" lang={lang}>{t.case.insufficentData}</div>
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combined} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 150)" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={3} angle={-30} textAnchor="end" height={50} stroke="oklch(0.50 0.02 150)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.50 0.02 150)" label={{ value: 'mm', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 6 }}
                      formatter={(v: number, _n, p) => [`${v.toFixed(2)} mm`, p?.payload?.kind === 'forecast' ? (lang === 'en' ? 'Forecast' : 'পূর্বাভাস') : (lang === 'en' ? 'Observed' : 'পর্যবেক্ষিত')]}
                    />
                    <ReferenceLine y={ypsaThreshold} stroke="oklch(0.55 0.20 25)" strokeDasharray="4 2" label={{ value: 'YPSA 100mm/24h equiv', fontSize: 9, fill: 'oklch(0.55 0.20 25)', position: 'insideTopRight' }} />
                    <Bar dataKey="mm" name="mm" radius={[2, 2, 0, 0]}>
                      {combined.map((d, i) => {
                        const color = d.kind === 'forecast' ? 'oklch(0.65 0.13 195)' : d.complete ? 'oklch(0.55 0.13 195)' : 'oklch(0.80 0.10 70)'
                        return <Cell key={i} fill={color} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
