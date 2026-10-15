'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mountain, MapPin, Ruler, TrendingUp, ChevronRight, ArrowLeft } from 'lucide-react'
import type { DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { ChattogramMap } from '@/components/pahar/chattogram-map'
import { BeforeAfterSlider } from '@/components/pahar/before-after-slider'
import { CaseStatusBadge, JurisdictionBadge, fmtDate, fmtDateOnly } from '@/components/pahar/badges'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface Props {
  data: DashboardDataDTO
  lang: Lang
  initialSlug?: string | null
  onSelectedChange?: (slug: string | null) => void
}

export function SitesView({ data, lang, initialSlug, onSelectedChange }: Props) {
  const t = dict[lang]
  const { sites, cases, bulletins } = data
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug ?? null)

  const handleSelect = useCallback((slug: string | null) => {
    setSelectedSlug(slug)
    onSelectedChange?.(slug)
  }, [onSelectedChange])
  const selected = sites.find((s) => s.slug === selectedSlug) ?? null

  if (selected) {
    return <SiteDetail slug={selected.slug} nameEn={selected.nameEn} nameBn={selected.nameBn} data={data} lang={lang} onBack={() => handleSelect(null)} />
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" lang={lang}>{t.site.title}</h1>
        <p className="text-sm text-muted-foreground mt-1" lang={lang}>{t.dashboard.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" lang={lang}>
              <MapPin className="h-4 w-4 text-primary" />
              {lang === 'en' ? 'Click a site to inspect' : 'পরিদর্শনে একটি সাইটে ক্লিক করুন'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChattogramMap
              sites={sites}
              bulletins={bulletins}
              cases={cases}
              lang={lang}
              height={420}
              selectedSiteId={selected?.id}
              onSelectSite={(slug) => handleSelect(slug)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" lang={lang}>{lang === 'en' ? 'Site list' : 'সাইট তালিকা'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[420px] overflow-y-auto scroll-thin">
            {sites.map((s) => {
              const siteCases = cases.filter((c) => c.siteId === s.id)
              const activeCases = siteCases.filter((c) => !['reviewed', 'rejected'].includes(c.status))
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.slug)}
                  className="w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm group-hover:text-primary" lang={lang}>
                        {lang === 'en' ? s.nameEn : s.nameBn}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{s.district} • {s.areaHectares.toFixed(1)} ha • {s.elevationM} m</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <JurisdictionBadge jurisdiction={s.jurisdiction} lang={lang} />
                        {activeCases.length > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-700">
                            {activeCases.length} {lang === 'en' ? 'active' : 'সক্রিয়'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SiteDetail({
  slug,
  nameEn,
  nameBn,
  data,
  lang,
  onBack,
}: {
  slug: string
  nameEn: string
  nameBn: string
  data: DashboardDataDTO
  lang: Lang
  onBack: () => void
}) {
  const t = dict[lang]
  const site = data.sites.find((s) => s.slug === slug)!
  const siteCases = data.cases.filter((c) => c.siteId === site.id)
  const rainfall = data.rainfallSummary[site.id]

  // Fetch weather intervals for this site
  const { data: weather, isLoading } = useQuery({
    queryKey: ['weather', site.id],
    queryFn: async () => {
      const res = await fetch(`/api/weather?siteId=${site.id}`, { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json() as Promise<{
        intervals: Array<{ id: string; source: string; intervalStart: string; intervalEnd: string; valueMm: number; isForecast: boolean; isComplete: boolean }>
        totals: Record<string, { totalMm: number; complete: boolean; asOf: string | null; expected: number; actual: number }>
      }>
    },
    enabled: !!site.id,
  })

  // Aggregate IMERG half-hour intervals into hourly for chart readability
  const chartData = (weather?.intervals ?? [])
    .filter((w) => w.source === 'imerg_early')
    .reduce((acc: Array<{ time: string; mm: number; complete: boolean }>, w) => {
      const d = new Date(w.intervalStart)
      const hourKey = d.toISOString().slice(0, 13) // YYYY-MM-DDTHH
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
      ...d,
      label: new Date(d.time + ':00:00Z').toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        timeZone: 'Asia/Dhaka',
      }),
    }))

  const forecastData = (weather?.intervals ?? [])
    .filter((w) => w.source === 'open_meteo' && w.isForecast)
    .map((w) => ({
      label: new Date(w.intervalStart).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        timeZone: 'Asia/Dhaka',
      }),
      mm: w.valueMm,
      complete: w.isComplete,
    }))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          <span lang={lang}>{t.common.back}</span>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" lang={lang}>{lang === 'en' ? nameEn : nameBn}</h1>
          <p className="text-sm text-muted-foreground mt-1">{site.district}</p>
        </div>
        <div className="flex items-center gap-2">
          <JurisdictionBadge jurisdiction={site.jurisdiction} lang={lang} />
          {site.slopeMaxDeg && (
            <Badge variant="outline" className="text-[10px]">
              <TrendingUp className="h-3 w-3 mr-1" />
              {site.slopeMaxDeg}° {t.site.slope}
            </Badge>
          )}
        </div>
      </div>

      {/* Site facts grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FactCard icon={<Ruler className="h-4 w-4" />} label={t.site.area} value={`${site.areaHectares.toFixed(1)} ha`} />
        <FactCard icon={<Mountain className="h-4 w-4" />} label={t.site.elevation} value={`${site.elevationM} m`} />
        <FactCard icon={<MapPin className="h-4 w-4" />} label={t.site.latitude} value={site.lat.toFixed(4)} />
        <FactCard icon={<MapPin className="h-4 w-4" />} label={t.site.longitude} value={site.lng.toFixed(4)} />
      </div>

      {/* Verification */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" lang={lang}>{t.site.jurisdiction}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground" lang={lang}>{t.site.jurisdiction}</span>
            <JurisdictionBadge jurisdiction={site.jurisdiction} lang={lang} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground shrink-0" lang={lang}>{t.site.verificationSource}</span>
            <span className="text-right text-xs">{site.verificationSrc ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Rainfall chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base" lang={lang}>{t.site.rainfallSummary}</CardTitle>
            {rainfall && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">24h:</span>
                <span className="font-semibold">{rainfall.total24h.toFixed(1)} mm</span>
                {!rainfall.complete && (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-700">
                    {t.dashboard.incompleteData}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <CardDescription className="text-xs">
            {lang === 'en'
              ? 'NASA IMERG half-hour rate × 0.5h (mm). Yellow bars = missing intervals. ~10 km cell.'
              : 'NASA IMERG অর্ধ-ঘণ্টা হার × ০.৫ঘা (মিমি)। হলুদ দণ্ড = অনুপস্থিত ব্যবধান। ~১০ কিমি সেল।'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[240px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground" lang={lang}>
              {t.case.insufficentData}
            </div>
          ) : (
            <>
              <div className="text-xs font-medium mb-2" lang={lang}>{lang === 'en' ? 'Observed (IMERG)' : 'পর্যবেক্ষিত (IMERG)'}</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 150)" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={2} angle={-30} textAnchor="end" height={50} stroke="oklch(0.50 0.02 150)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.50 0.02 150)" label={{ value: 'mm', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid oklch(0.85 0.02 150)' }}
                      formatter={(v: number, _n, p) => [`${v.toFixed(2)} mm`, p?.payload?.complete ? 'OK' : 'GAP']}
                    />
                    <Bar dataKey="mm" name="mm" radius={[2, 2, 0, 0]}>
                      {chartData.map((d, i) => (
                        <CellBar key={i} complete={d.complete} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {forecastData.length > 0 && (
                <>
                  <div className="text-xs font-medium mb-2 mt-4" lang={lang}>{lang === 'en' ? 'Forecast (Open-Meteo GFS)' : 'পূর্বাভাস (Open-Meteo GFS)'}</div>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecastData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 150)" />
                        <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={2} angle={-30} textAnchor="end" height={50} stroke="oklch(0.50 0.02 150)" />
                        <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.50 0.02 150)" />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: number) => [`${v.toFixed(2)} mm`, 'Forecast']} />
                        <Bar dataKey="mm" fill="oklch(0.65 0.13 195)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* Totals table */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {['24h', '48h', '72h', '120h'].map((w) => {
                  const total = weather?.totals?.[w]
                  return (
                    <div key={w} className="border border-border rounded p-2 bg-muted/30">
                      <div className="text-[10px] text-muted-foreground uppercase">{w}</div>
                      <div className="font-semibold text-sm">{total?.totalMm.toFixed(1) ?? '—'} mm</div>
                      <div className={`text-[10px] ${total?.complete ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {total?.complete ? (lang === 'en' ? 'complete' : 'সম্পূর্ণ') : `${total?.actual ?? 0}/${total?.expected ?? 0} ${lang === 'en' ? 'gaps' : 'শূন্য'}`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent cases */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" lang={lang}>{t.site.recentCases}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {siteCases.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground" lang={lang}>
              {lang === 'en' ? 'No cases at this site.' : 'এই সাইটে কোনো কেস নেই।'}
            </div>
          ) : (
            siteCases.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2.5 rounded border border-border bg-card">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs font-semibold">{c.caseKey}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {fmtDate(c.detectedAt, lang)} • {c.changedAreaHa?.toFixed(2) ?? '—'} ha • {c.coveragePct?.toFixed(0) ?? '—'}%
                  </div>
                </div>
                <CaseStatusBadge status={c.status} lang={lang} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FactCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
          {icon}
          {label}
        </div>
        <div className="text-base font-semibold mt-0.5">{value}</div>
      </CardContent>
    </Card>
  )
}

// Recharts requires a Cell child to color individual bars
function CellBar({ complete }: { complete: boolean }) {
  return <Cell fill={complete ? 'oklch(0.55 0.13 195)' : 'oklch(0.80 0.10 70)'} />
}
