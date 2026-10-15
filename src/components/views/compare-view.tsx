'use client'

// PaharPahara — Comparison view.
// Two modes: (1) Case comparison — before/after imagery + change metrics side-by-side.
//            (2) Site comparison — rainfall totals, source-health, active-case counts across sites.

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { GitCompare, X, ArrowLeftRight, Image as ImageIcon, TrendingUp, Activity, MapPin, CloudRain, Mountain, FileText } from 'lucide-react'
import type { CaseDTO, DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { CaseStatusBadge, fmtDateOnly, fmtDate, relativeTime } from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
}

const MAX_COMPARE = 4
type CompareMode = 'cases' | 'sites'

export function CompareView({ data, lang }: Props) {
  const t = dict[lang]
  const [mode, setMode] = useState<CompareMode>('cases')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const selectedCases = useMemo(
    () => data.cases.filter((c) => selected.has(c.id)),
    [data.cases, selected],
  )

  const selectedSites = useMemo(
    () => data.sites.filter((s) => selected.has(s.id)),
    [data.sites, selected],
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= MAX_COMPARE) return prev // Don't exceed max
        next.add(id)
      }
      return next
    })
  }

  const switchMode = (m: CompareMode) => {
    if (m === mode) return
    setMode(m)
    setSelected(new Set()) // clear selection when switching mode
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" lang={lang}>
            <GitCompare className="h-6 w-6 text-primary" />
            {t.nav.compare}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" lang={lang}>
            {mode === 'cases'
              ? (lang === 'en'
                  ? `Select 2–${MAX_COMPARE} cases to compare before/after imagery and change metrics side-by-side.`
                  : `পূর্ব/পরবর্তী চিত্র ও পরিবর্তন মেট্রিক্স পাশাপাশি তুলনা করতে ২–${MAX_COMPARE} কেস নির্বাচন করুন।`)
              : (lang === 'en'
                  ? `Select 2–${MAX_COMPARE} sites to compare rainfall, source-health, and active-case counts.`
                  : `বৃষ্টিপাত, উৎস-স্বাস্থ্য ও সক্রিয় কেস সংখ্যা তুলনা করতে ২–${MAX_COMPARE} সাইট নির্বাচন করুন।`)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center rounded-md border border-border bg-card p-0.5">
            <button
              onClick={() => switchMode('cases')}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors flex items-center gap-1 ${
                mode === 'cases' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3 w-3" />
              {lang === 'en' ? 'Cases' : 'কেস'}
            </button>
            <button
              onClick={() => switchMode('sites')}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors flex items-center gap-1 ${
                mode === 'sites' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="h-3 w-3" />
              {lang === 'en' ? 'Sites' : 'সাইট'}
            </button>
          </div>
          <Badge variant="outline" className="text-[10px] gap-1.5">
            {selected.size}/{MAX_COMPARE}
          </Badge>
          {selected.size > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="h-8 text-xs gap-1">
              <X className="h-3 w-3" />
              {lang === 'en' ? 'Clear' : 'মুছুন'}
            </Button>
          )}
        </div>
      </div>

      {mode === 'cases' ? (
        <CasesCompare data={data} lang={lang} selected={selected} selectedCases={selectedCases} toggle={toggle} />
      ) : (
        <SitesCompare data={data} lang={lang} selected={selected} selectedSites={selectedSites} toggle={toggle} />
      )}
    </div>
  )
}

// ===========================================================================
// Cases comparison (previously the full CompareView)
// ===========================================================================

function CasesCompare({
  data,
  lang,
  selected,
  selectedCases,
  toggle,
}: {
  data: DashboardDataDTO
  lang: Lang
  selected: Set<string>
  selectedCases: CaseDTO[]
  toggle: (id: string) => void
}) {
  const t = dict[lang]
  return (
    <>
      {/* Case picker */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" lang={lang}>{lang === 'en' ? 'Select cases to compare' : 'তুলনা করতে কেস নির্বাচন করুন'}</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {data.cases.map((c) => {
            const isSel = selected.has(c.id)
            const disabled = !isSel && selected.size >= MAX_COMPARE
            return (
              <label
                key={c.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isSel
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : disabled
                      ? 'border-border opacity-40 cursor-not-allowed'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <Checkbox
                  checked={isSel}
                  disabled={disabled}
                  onCheckedChange={() => toggle(c.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] font-semibold truncate">{c.caseKey}</div>
                  <div className="text-[10px] text-muted-foreground truncate" lang={lang}>
                    {lang === 'en' ? c.siteNameEn : c.siteNameBn}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CaseStatusBadge status={c.status} lang={lang} />
                    <span className="text-[9px] text-muted-foreground">{c.changedAreaHa?.toFixed(2) ?? '—'} ha</span>
                  </div>
                </div>
              </label>
            )
          })}
        </CardContent>
      </Card>

      {/* Comparison grid */}
      {selectedCases.length >= 2 ? (
        <ComparisonGrid cases={selectedCases} lang={lang} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-flex h-14 w-14 rounded-full bg-muted items-center justify-center mb-3">
              <ArrowLeftRight className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-1" lang={lang}>
              {lang === 'en' ? 'Select at least 2 cases to compare.' : 'তুলনা করতে অন্তত ২টি কেস নির্বাচন করুন।'}
            </p>
            <p className="text-xs text-muted-foreground/70" lang={lang}>
              {lang === 'en' ? `Up to ${MAX_COMPARE} cases can be compared at once.` : `একসাথে সর্বোচ্চ ${MAX_COMPARE} কেস তুলনা করা যাবে।`}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function ComparisonGrid({ cases, lang }: { cases: CaseDTO[]; lang: Lang }) {
  const t = dict[lang]

  return (
    <div className="space-y-4">
      {/* Before images */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <ImageIcon className="h-4 w-4 text-primary" />
            {t.case.before}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cases.length}, minmax(0, 1fr))` }}
          >
            {cases.map((c) => (
              <div key={c.id} className="space-y-1.5">
                <div className="font-mono text-[10px] font-semibold truncate">{c.caseKey}</div>
                <div className="rounded-md overflow-hidden border border-border bg-muted aspect-[4/3]">
                  {c.beforeAsset?.fileUri ? (
                    <img src={c.beforeAsset.fileUri} alt={c.caseKey} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  {c.beforeAsset ? fmtDateOnly(c.beforeAsset.acquiredAt, lang) : '—'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* After images */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <ImageIcon className="h-4 w-4 text-primary" />
            {t.case.after}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cases.length}, minmax(0, 1fr))` }}
          >
            {cases.map((c) => (
              <div key={c.id} className="space-y-1.5">
                <div className="font-mono text-[10px] font-semibold truncate opacity-0">{c.caseKey}</div>
                <div className="rounded-md overflow-hidden border border-border bg-muted aspect-[4/3]">
                  {c.afterAsset?.fileUri ? (
                    <img src={c.afterAsset.fileUri} alt={c.caseKey} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  {c.afterAsset ? fmtDateOnly(c.afterAsset.acquiredAt, lang) : '—'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metrics table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <TrendingUp className="h-4 w-4 text-primary" />
            {lang === 'en' ? 'Change metrics' : 'পরিবর্তন মেট্রিক্স'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wide sticky left-0 bg-card">
                    {lang === 'en' ? 'Metric' : 'মেট্রিক'}
                  </th>
                  {cases.map((c) => (
                    <th key={c.id} className="text-left p-2 font-mono text-[10px] font-semibold min-w-[120px]">
                      {c.caseKey}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <MetricRow label={lang === 'en' ? 'Site' : 'সাইট'} cases={cases} lang={lang} getter={(c) => lang === 'en' ? c.siteNameEn : c.siteNameBn} />
                <MetricRow label={t.case.status} cases={cases} lang={lang} getter={(c) => c.status.replace(/_/g, ' ')} renderBadge={(c) => <CaseStatusBadge status={c.status} lang={lang} />} />
                <MetricRow label={t.case.changedArea} cases={cases} lang={lang} getter={(c) => `${c.changedAreaHa?.toFixed(2) ?? '—'} ha`} toneValue={(c) => c.changedAreaHa} warnTone={(v) => v != null && v > 0.5} />
                <MetricRow label={t.case.ndviDelta} cases={cases} lang={lang} getter={(c) => c.ndviDelta?.toFixed(2) ?? '—'} toneValue={(c) => c.ndviDelta} warnTone={(v) => v != null && v < -0.15} />
                <MetricRow label={t.case.bareSoilDelta} cases={cases} lang={lang} getter={(c) => c.bareSoilDelta?.toFixed(2) ?? '—'} toneValue={(c) => c.bareSoilDelta} warnTone={(v) => v != null && v > 0.15} />
                <MetricRow label={t.case.dwTreeProbDelta} cases={cases} lang={lang} getter={(c) => c.dwTreeProbDelta?.toFixed(2) ?? '—'} toneValue={(c) => c.dwTreeProbDelta} warnTone={(v) => v != null && v < -0.15} />
                <MetricRow label={t.case.dwBareProbDelta} cases={cases} lang={lang} getter={(c) => c.dwBareProbDelta?.toFixed(2) ?? '—'} toneValue={(c) => c.dwBareProbDelta} warnTone={(v) => v != null && v > 0.15} />
                <MetricRow label={t.case.coverage} cases={cases} lang={lang} getter={(c) => `${c.coveragePct?.toFixed(0) ?? '—'}%`} toneValue={(c) => c.coveragePct} warnTone={(v) => v != null && v < 75} />
                <MetricRow label={t.case.detectedAt} cases={cases} lang={lang} getter={(c) => fmtDateOnly(c.detectedAt, lang)} />
                <MetricRow label={t.case.disturbanceType} cases={cases} lang={lang} getter={(c) => (c.disturbanceType ?? '—').replace(/_/g, ' ')} />
                <MetricRow label={t.case.methodVersion} cases={cases} lang={lang} getter={(c) => c.methodVersion ?? '—'} mono />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Min/max highlight per metric */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <Activity className="h-4 w-4 text-primary" />
            {lang === 'en' ? 'Extremes' : 'চরম মান'}
          </CardTitle>
          <CardDescription className="text-xs" lang={lang}>
            {lang === 'en' ? 'Highest and lowest values across selected cases.' : 'নির্বাচিত কেসগুলোর মধ্যে সর্বোচ্চ ও সর্বনিম্ন মান।'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {extremes(cases).map((e) => (
              <div key={e.label} className="border border-border rounded-lg p-2.5 bg-card">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{e.label}</div>
                <div className="flex items-center gap-3 mt-1">
                  <div>
                    <div className="text-[9px] text-muted-foreground">{lang === 'en' ? 'Highest' : 'সর্বোচ্চ'}</div>
                    <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 font-mono">
                      {e.max.caseKey.split('-')[0]}: {e.max.value}
                    </div>
                  </div>
                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <div className="text-[9px] text-muted-foreground">{lang === 'en' ? 'Lowest' : 'সর্বনিম্ন'}</div>
                    <div className="text-sm font-semibold text-rose-700 dark:text-rose-300 font-mono">
                      {e.min.caseKey.split('-')[0]}: {e.min.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricRow({
  label,
  cases,
  lang: _lang,
  getter,
  renderBadge,
  toneValue,
  warnTone,
  mono,
}: {
  label: string
  cases: CaseDTO[]
  lang: Lang
  getter: (c: CaseDTO) => string
  renderBadge?: (c: CaseDTO) => React.ReactNode
  toneValue?: (c: CaseDTO) => number | null | undefined
  warnTone?: (v: number) => boolean
  mono?: boolean
}) {
  return (
    <tr className="border-b border-border/50 hover:bg-muted/20">
      <td className="p-2 text-[11px] text-muted-foreground font-medium sticky left-0 bg-card">
        {label}
      </td>
      {cases.map((c) => {
        const value = getter(c)
        const tone = toneValue && warnTone && toneValue(c) != null ? (warnTone(toneValue(c)!) ? 'warn' : 'ok') : 'default'
        return (
          <td key={c.id} className="p-2">
            {renderBadge ? (
              renderBadge(c)
            ) : (
              <span className={`${mono ? 'font-mono text-[10px]' : 'text-xs font-medium'} ${
                tone === 'warn' ? 'text-amber-700 dark:text-amber-300' : tone === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : ''
              }`}>
                {value}
              </span>
            )}
          </td>
        )
      })}
    </tr>
  )
}

function extremes(cases: CaseDTO[]) {
  const metrics: Array<{ label: string; key: keyof CaseDTO }> = [
    { label: 'Changed area (ha)', key: 'changedAreaHa' },
    { label: 'NDVI Δ', key: 'ndviDelta' },
    { label: 'Bare-soil Δ', key: 'bareSoilDelta' },
    { label: 'Coverage %', key: 'coveragePct' },
  ]
  return metrics
    .map((m) => {
      const vals = cases
        .map((c) => ({ caseKey: c.caseKey, value: c[m.key] as number | null }))
        .filter((v) => v.value != null) as Array<{ caseKey: string; value: number }>
      if (vals.length === 0) return null
      const max = vals.reduce((a, b) => (b.value > a.value ? b : a))
      const min = vals.reduce((a, b) => (b.value < a.value ? b : a))
      return {
        label: m.label,
        max: { caseKey: max.caseKey, value: max.value.toFixed(2) },
        min: { caseKey: min.caseKey, value: min.value.toFixed(2) },
      }
    })
    .filter(Boolean) as Array<{ label: string; max: { caseKey: string; value: string }; min: { caseKey: string; value: string } }>
}

// ===========================================================================
// Sites comparison
// ===========================================================================

function SitesCompare({
  data,
  lang,
  selected,
  selectedSites,
  toggle,
}: {
  data: DashboardDataDTO
  lang: Lang
  selected: Set<string>
  selectedSites: DashboardDataDTO['sites']
  toggle: (id: string) => void
}) {
  const t = dict[lang]
  const { rainfallSummary, cases, sources } = data

  return (
    <>
      {/* Site picker */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" lang={lang}>{lang === 'en' ? 'Select sites to compare' : 'তুলনা করতে সাইট নির্বাচন করুন'}</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {data.sites.map((s) => {
            const isSel = selected.has(s.id)
            const disabled = !isSel && selected.size >= MAX_COMPARE
            const siteCases = cases.filter((c) => c.siteId === s.id)
            const activeCount = siteCases.filter((c) => !['reviewed', 'rejected'].includes(c.status)).length
            return (
              <label
                key={s.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isSel
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : disabled
                      ? 'border-border opacity-40 cursor-not-allowed'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <Checkbox
                  checked={isSel}
                  disabled={disabled}
                  onCheckedChange={() => toggle(s.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs truncate" lang={lang}>
                    {lang === 'en' ? s.nameEn : s.nameBn}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{s.district}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.areaHectares.toFixed(1)} ha</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.elevationM} m</span>
                    {activeCount > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        {activeCount} {lang === 'en' ? 'active' : 'সক্রিয়'}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            )
          })}
        </CardContent>
      </Card>

      {selectedSites.length >= 2 ? (
        <SitesComparisonGrid sites={selectedSites} rainfallSummary={rainfallSummary} cases={cases} lang={lang} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-flex h-14 w-14 rounded-full bg-muted items-center justify-center mb-3">
              <ArrowLeftRight className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-1" lang={lang}>
              {lang === 'en' ? 'Select at least 2 sites to compare.' : 'তুলনা করতে অন্তত ২টি সাইট নির্বাচন করুন।'}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function SitesComparisonGrid({
  sites,
  rainfallSummary,
  cases,
  lang,
}: {
  sites: DashboardDataDTO['sites']
  rainfallSummary: DashboardDataDTO['rainfallSummary']
  cases: DashboardDataDTO['cases']
  lang: Lang
}) {
  const t = dict[lang]

  return (
    <div className="space-y-4">
      {/* Rainfall comparison bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <CloudRain className="h-4 w-4 text-primary" />
            {lang === 'en' ? 'Rainfall comparison' : 'বৃষ্টিপাত তুলনা'}
          </CardTitle>
          <CardDescription className="text-xs" lang={lang}>
            {lang === 'en' ? '24h and 72h totals per site. Yellow = incomplete data.' : 'প্রতি সাইটে ২৪ঘা ও ৭২ঘা মোট। হলুদ = অসম্পূর্ণ তথ্য।'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2.5 font-medium text-muted-foreground text-[10px] uppercase tracking-wide sticky left-0 bg-card">
                    {lang === 'en' ? 'Site' : 'সাইট'}
                  </th>
                  {sites.map((s) => (
                    <th key={s.id} className="text-left p-2.5 min-w-[120px]">
                      <div className="font-medium text-xs truncate" lang={lang}>{lang === 'en' ? s.nameEn.split(' ')[0] : s.nameBn.split(' ')[0]}</div>
                      <div className="text-[9px] text-muted-foreground truncate">{s.district}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Rainfall 24h */}
                <tr className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-2.5 text-[11px] text-muted-foreground font-medium sticky left-0 bg-card">
                    {lang === 'en' ? 'Rainfall 24h' : 'বৃষ্টিপাত ২৪ঘা'}
                  </td>
                  {sites.map((s) => {
                    const r = rainfallSummary[s.id]
                    const val = r?.total24h ?? 0
                    const overTrigger = val >= 100
                    const incomplete = !r?.complete
                    return (
                      <td key={s.id} className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${overTrigger ? 'bg-rose-500' : incomplete ? 'bg-amber-400' : 'bg-sky-500'}`}
                              style={{ width: `${Math.min(100, (val / 150) * 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium tabular-nums ${overTrigger ? 'text-rose-700 dark:text-rose-300' : ''}`}>
                            {val.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
                {/* Rainfall 72h */}
                <tr className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-2.5 text-[11px] text-muted-foreground font-medium sticky left-0 bg-card">
                    {lang === 'en' ? 'Rainfall 72h' : 'বৃষ্টিপাত ৭২ঘা'}
                  </td>
                  {sites.map((s) => {
                    const r = rainfallSummary[s.id]
                    const val = r?.total72h ?? 0
                    return (
                      <td key={s.id} className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${val >= 200 ? 'bg-rose-500' : 'bg-sky-400'}`}
                              style={{ width: `${Math.min(100, (val / 300) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium tabular-nums">{val.toFixed(1)}</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
                {/* Active cases */}
                <tr className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-2.5 text-[11px] text-muted-foreground font-medium sticky left-0 bg-card">
                    {lang === 'en' ? 'Active cases' : 'সক্রিয় কেস'}
                  </td>
                  {sites.map((s) => {
                    const siteCases = cases.filter((c) => c.siteId === s.id)
                    const active = siteCases.filter((c) => !['reviewed', 'rejected'].includes(c.status)).length
                    const total = siteCases.length
                    return (
                      <td key={s.id} className="p-2.5">
                        <span className="text-xs font-medium tabular-nums">
                          <span className={active > 0 ? 'text-amber-700 dark:text-amber-300 font-bold' : ''}>{active}</span>
                          <span className="text-muted-foreground"> / {total}</span>
                        </span>
                      </td>
                    )
                  })}
                </tr>
                {/* Area */}
                <tr className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-2.5 text-[11px] text-muted-foreground font-medium sticky left-0 bg-card">
                    {lang === 'en' ? 'Area (ha)' : 'এলাকা (হেক্টর)'}
                  </td>
                  {sites.map((s) => (
                    <td key={s.id} className="p-2.5 text-xs font-medium tabular-nums">{s.areaHectares.toFixed(1)}</td>
                  ))}
                </tr>
                {/* Elevation */}
                <tr className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-2.5 text-[11px] text-muted-foreground font-medium sticky left-0 bg-card">
                    {lang === 'en' ? 'Elevation (m)' : 'উচ্চতা (মিটার)'}
                  </td>
                  {sites.map((s) => (
                    <td key={s.id} className="p-2.5 text-xs font-medium tabular-nums">{s.elevationM}</td>
                  ))}
                </tr>
                {/* Slope */}
                <tr className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-2.5 text-[11px] text-muted-foreground font-medium sticky left-0 bg-card">
                    {lang === 'en' ? 'Max slope (°)' : 'সর্বোচ্চ ঢাল (°)'}
                  </td>
                  {sites.map((s) => (
                    <td key={s.id} className="p-2.5 text-xs font-medium tabular-nums">{s.slopeMaxDeg ?? '—'}</td>
                  ))}
                </tr>
                {/* Jurisdiction */}
                <tr className="hover:bg-muted/20">
                  <td className="p-2.5 text-[11px] text-muted-foreground font-medium sticky left-0 bg-card">
                    {lang === 'en' ? 'Jurisdiction' : 'এখতিয়ার'}
                  </td>
                  {sites.map((s) => (
                    <td key={s.id} className="p-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        s.jurisdiction === 'verified_doe'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : s.jurisdiction === 'verified_forest'
                            ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300'
                            : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                      }`}>
                        {s.jurisdiction.replace(/_/g, ' ')}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary extremes */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <Activity className="h-4 w-4 text-primary" />
            {lang === 'en' ? 'Key differences' : 'মূল পার্থক্য'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {siteExtremes(sites, rainfallSummary, cases).map((e) => (
              <div key={e.label} className="border border-border rounded-lg p-2.5 bg-card">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{e.label}</div>
                <div className="flex items-center gap-3 mt-1">
                  <div>
                    <div className="text-[9px] text-muted-foreground">{lang === 'en' ? 'Highest' : 'সর্বোচ্চ'}</div>
                    <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      {e.max.name}: <span className="font-mono">{e.max.value}</span>
                    </div>
                  </div>
                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <div className="text-[9px] text-muted-foreground">{lang === 'en' ? 'Lowest' : 'সর্বনিম্ন'}</div>
                    <div className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                      {e.min.name}: <span className="font-mono">{e.min.value}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function siteExtremes(
  sites: DashboardDataDTO['sites'],
  rainfallSummary: DashboardDataDTO['rainfallSummary'],
  cases: DashboardDataDTO['cases'],
) {
  const out: Array<{ label: string; max: { name: string; value: string }; min: { name: string; value: string } }> = []

  // Rainfall 24h
  const r24 = sites.map((s) => ({ name: s.nameEn.split(' ')[0], value: rainfallSummary[s.id]?.total24h ?? 0 }))
  if (r24.length > 0) {
    const max = r24.reduce((a, b) => (b.value > a.value ? b : a))
    const min = r24.reduce((a, b) => (b.value < a.value ? b : a))
    out.push({ label: 'Rainfall 24h (mm)', max: { name: max.name, value: max.value.toFixed(1) }, min: { name: min.name, value: min.value.toFixed(1) } })
  }

  // Rainfall 72h
  const r72 = sites.map((s) => ({ name: s.nameEn.split(' ')[0], value: rainfallSummary[s.id]?.total72h ?? 0 }))
  if (r72.length > 0) {
    const max = r72.reduce((a, b) => (b.value > a.value ? b : a))
    const min = r72.reduce((a, b) => (b.value < a.value ? b : a))
    out.push({ label: 'Rainfall 72h (mm)', max: { name: max.name, value: max.value.toFixed(1) }, min: { name: min.name, value: min.value.toFixed(1) } })
  }

  // Area
  const areas = sites.map((s) => ({ name: s.nameEn.split(' ')[0], value: s.areaHectares }))
  if (areas.length > 0) {
    const max = areas.reduce((a, b) => (b.value > a.value ? b : a))
    const min = areas.reduce((a, b) => (b.value < a.value ? b : a))
    out.push({ label: 'Area (ha)', max: { name: max.name, value: max.value.toFixed(1) }, min: { name: min.name, value: min.value.toFixed(1) } })
  }

  // Active cases
  const active = sites.map((s) => {
    const siteCases = cases.filter((c) => c.siteId === s.id)
    return { name: s.nameEn.split(' ')[0], value: siteCases.filter((c) => !['reviewed', 'rejected'].includes(c.status)).length }
  })
  if (active.length > 0) {
    const max = active.reduce((a, b) => (b.value > a.value ? b : a))
    const min = active.reduce((a, b) => (b.value < a.value ? b : a))
    out.push({ label: 'Active cases', max: { name: max.name, value: String(max.value) }, min: { name: min.name, value: String(min.value) } })
  }

  return out
}
