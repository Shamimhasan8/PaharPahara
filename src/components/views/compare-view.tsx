'use client'

// PaharPahara — Case comparison view.
// Select 2-4 cases and view their before/after imagery + change metrics side-by-side.

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { GitCompare, X, ArrowLeftRight, Image as ImageIcon, TrendingUp, Activity } from 'lucide-react'
import type { CaseDTO, DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { CaseStatusBadge, fmtDateOnly } from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
}

const MAX_COMPARE = 4

export function CompareView({ data, lang }: Props) {
  const t = dict[lang]
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const selectedCases = useMemo(
    () => data.cases.filter((c) => selected.has(c.id)),
    [data.cases, selected],
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
            {lang === 'en'
              ? `Select 2–${MAX_COMPARE} cases to compare before/after imagery and change metrics side-by-side.`
              : `পূর্ব/পরবর্তী চিত্র ও পরিবর্তন মেট্রিক্স পাশাপাশি তুলনা করতে ২–${MAX_COMPARE} কেস নির্বাচন করুন।`}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
    </div>
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
