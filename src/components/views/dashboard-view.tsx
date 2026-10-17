'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mountain, CloudRain, AlertTriangle, FileText, Activity, MapPin, TrendingUp, ShieldCheck, Download, Upload } from 'lucide-react'
import type { DashboardDataDTO, Role } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { ChattogramMap } from '@/components/pahar/chattogram-map'
import { RealMap } from '@/components/pahar/real-map'
import { ActivityFeed } from '@/components/pahar/activity-feed'
import { SourceHealthSparklines } from '@/components/pahar/source-health-sparklines'
import { DashboardForecastChart } from '@/components/pahar/dashboard-forecast-chart'
import {
  AccessStateBadge,
  CaseStatusBadge,
  JurisdictionBadge,
  fmtDate,
  fmtDateOnly,
  relativeTime,
} from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
  role: Role
  setTab: (t: string) => void
}

export function DashboardView({ data, lang, role, setTab }: Props) {
  const t = dict[lang]
  const { sites, cases, bulletins, sources, jobs, notifications, rainfallSummary } = data
  const [importPreview, setImportPreview] = useState<{ data: Record<string, unknown>; filename: string } | null>(null)

  // Active alerts (messageType === 'alert')
  const activeAlerts = bulletins.filter((b) => b.messageType === 'alert')
  const topAlert = activeAlerts[0]
  const activeCases = cases.filter((c) => !['reviewed', 'rejected'].includes(c.status))
  const runningJobs = jobs.filter((j) => j.state === 'running' || j.state === 'queued')
  const failedJobs = jobs.filter((j) => j.state === 'failed')
  const unread = notifications.filter((n) => !n.read).length
  const liveSources = sources.filter((s) => s.accessState === 'live').length
  const replaySources = sources.filter((s) => s.accessState === 'historical_replay').length
  const unavailableSources = sources.filter((s) => s.accessState === 'unavailable').length

  // Rainfall stats
  const maxRain24h = Math.max(0, ...sites.map((s) => rainfallSummary[s.id]?.total24h ?? 0))
  const maxRain72h = Math.max(0, ...sites.map((s) => rainfallSummary[s.id]?.total72h ?? 0))
  const anyIncomplete = sites.some((s) => !rainfallSummary[s.id]?.complete)

  return (
    <div className="space-y-5">
      {/* Header with personalized greeting */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80" lang={lang}>
            {greeting(lang)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5" lang={lang}>{t.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground mt-1" lang={lang}>{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span lang={lang}>{lang === 'en' ? 'Live' : 'লাইভ'}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span lang={lang}>{relativeTime(new Date().toISOString(), lang)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/api/dashboard/export', '_blank')}
            className="h-8 gap-1.5"
            title={lang === 'en' ? 'Export dashboard data as JSON' : 'ড্যাশবোর্ড ডেটা JSON হিসেবে রপ্তানি'}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline" lang={lang}>{lang === 'en' ? 'Export' : 'রপ্তানি'}</span>
          </Button>
          <label
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
            title={lang === 'en' ? 'Import dashboard data from JSON' : 'JSON থেকে ড্যাশবোর্ড ডেটা ইম্পোর্ট'}
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline" lang={lang}>{lang === 'en' ? 'Import' : 'ইম্পোর্ট'}</span>
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  try {
                    const json = ev.target?.result as string
                    const parsed = JSON.parse(json)
                    // Show preview dialog instead of immediate reload
                    setImportPreview({ data: parsed, filename: file.name })
                  } catch {
                    alert(lang === 'en' ? 'Invalid JSON file' : 'অবৈধ JSON ফাইল')
                  }
                }
                reader.readAsText(file)
              }}
            />
          </label>
        </div>
      </div>

      {/* BMD banner */}
      {topAlert ? (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-stretch">
              {/* Left accent stripe */}
              <div className="w-1.5 bg-amber-500 shrink-0" />
              <div className="flex-1 py-3 px-3 sm:px-4 flex items-start gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-amber-900 dark:text-amber-200" lang={lang}>{t.dashboard.bmdBanner}</span>
                    {topAlert.hasValidityConflict && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200 font-semibold uppercase tracking-wide">
                        {lang === 'en' ? 'Validity conflict' : 'বৈধতা অমিল'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-0.5 leading-snug" lang={lang}>
                    {lang === 'en' ? topAlert.headlineEn : topAlert.headlineBn}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span>{lang === 'en' ? 'Sent' : 'প্রেরিত'}: {fmtDate(topAlert.sentAt, lang)}</span>
                    {topAlert.expiresAt && (
                      <span className="flex items-center gap-1">
                        <span className="opacity-50">•</span>
                        <span>{lang === 'en' ? 'XML expires' : 'XML মেয়াদ'}: {fmtDate(topAlert.expiresAt, lang)}</span>
                      </span>
                    )}
                    {topAlert.textEffectiveEnd && (
                      <span className="flex items-center gap-1">
                        <span className="opacity-50">•</span>
                        <span>{lang === 'en' ? 'Text window' : 'টেক্সট উইন্ডো'}: {fmtDateOnly(topAlert.textEffectiveStart, lang)} → {fmtDateOnly(topAlert.textEffectiveEnd, lang)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setTab('preparedness')} className="shrink-0 self-center border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40 w-full sm:w-auto">
                  {lang === 'en' ? 'Details' : 'বিস্তারিত'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-stretch">
              <div className="w-1.5 bg-emerald-500 shrink-0" />
              <div className="flex-1 py-3 px-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-emerald-900 dark:text-emerald-200" lang={lang}>{t.dashboard.noActiveAlert}</div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400" lang={lang}>
                    {lang === 'en' ? 'Absence of an alert does not establish safety.' : 'সতর্কতার অভাব নিরাপত্তা নিশ্চিত করে না।'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Zone Summary — Red/Yellow/Green alert system */}
      {data.riskSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Red Zone */}
          <div
            className="rounded-xl p-4 border-2 border-red-300 dark:border-red-800 shadow-premium cursor-pointer hover:shadow-premium-hover transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))' }}
            onClick={() => setTab('sites')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-300 text-lg">🔴</span>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-300" lang={lang}>
                    {lang === 'en' ? 'Red Zone' : 'লাল জোন'}
                  </div>
                  <div className="text-[10px] text-red-600/70 dark:text-red-400/70" lang={lang}>
                    {lang === 'en' ? 'High Risk — Danger' : 'উচ্চ ঝুঁকি — বিপজ্জনক'}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300 tabular-nums">
                {data.riskSummary.red.count}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {data.riskSummary.red.areaHectares.toFixed(1)} ha {lang === 'en' ? 'at risk' : 'ঝুঁকিতে'}
              {data.riskSummary.red.population > 0 && (
                <span> · {data.riskSummary.red.population.toLocaleString()} {lang === 'en' ? 'people' : 'জন'}</span>
              )}
            </div>
          </div>

          {/* Yellow Zone */}
          <div
            className="rounded-xl p-4 border-2 border-amber-300 dark:border-amber-800 shadow-premium cursor-pointer hover:shadow-premium-hover transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))' }}
            onClick={() => setTab('sites')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <span className="text-amber-600 dark:text-amber-300 text-lg">🟡</span>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300" lang={lang}>
                    {lang === 'en' ? 'Yellow Zone' : 'হলুদ জোন'}
                  </div>
                  <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70" lang={lang}>
                    {lang === 'en' ? 'Moderate Risk — Monitor' : 'মাঝারি ঝুঁকি — নজরদারি'}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                {data.riskSummary.yellow.count}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {data.riskSummary.yellow.areaHectares.toFixed(1)} ha {lang === 'en' ? 'monitored' : 'পর্যবেক্ষিত'}
              {data.riskSummary.yellow.population > 0 && (
                <span> · {data.riskSummary.yellow.population.toLocaleString()} {lang === 'en' ? 'people' : 'জন'}</span>
              )}
            </div>
          </div>

          {/* Green Zone */}
          <div
            className="rounded-xl p-4 border-2 border-emerald-300 dark:border-emerald-800 shadow-premium cursor-pointer hover:shadow-premium-hover transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.03))' }}
            onClick={() => setTab('sites')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-300 text-lg">🟢</span>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300" lang={lang}>
                    {lang === 'en' ? 'Green Zone' : 'সবুজ জোন'}
                  </div>
                  <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70" lang={lang}>
                    {lang === 'en' ? 'Low Risk — Safe' : 'নিম্ন ঝুঁকি — নিরাপদ'}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {data.riskSummary.green.count}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {data.riskSummary.green.areaHectares.toFixed(1)} ha {lang === 'en' ? 'safe area' : 'নিরাপদ এলাকা'}
              {data.riskSummary.green.population > 0 && (
                <span> · {data.riskSummary.green.population.toLocaleString()} {lang === 'en' ? 'people' : 'জন'}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Helper text for beginners */}
      <div className="text-center text-[11px] text-muted-foreground/60 py-1" lang={lang}>
        {lang === 'en'
          ? '🔴 = High risk (action needed) · 🟡 = Moderate risk (monitor) · 🟢 = Low risk (safe) — Click any card to see details'
          : '🔴 = উচ্চ ঝুঁকি (পদক্ষেপ প্রয়োজন) · 🟡 = মাঝারি ঝুঁকি (নজরদারি) · 🟢 = নিম্ন ঝুঁকি (নিরাপদ) — বিস্তারিত দেখতে যেকোনো কার্ডে ক্লিক করুন'}
      </div>

      {/* Stat cards — simplified for beginners */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Mountain className="h-4 w-4" />}
          label={lang === 'en' ? 'Hills Monitored' : 'পর্যবেক্ষিত পাহাড়'}
          value={`${sites.length}`}
          sub={
            lang === 'en'
              ? `${sites.filter((s) => s.riskLevel === 'red').length} high risk · ${sites.filter((s) => s.riskLevel === 'yellow').length} moderate`
              : `${sites.filter((s) => s.riskLevel === 'red').length} উচ্চ ঝুঁকি · ${sites.filter((s) => s.riskLevel === 'yellow').length} মাঝারি`
          }
          color="emerald"
          onClick={() => setTab('sites')}
        />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label={lang === 'en' ? 'Active Incidents' : 'সক্রিয় ঘটনা'}
          value={`${activeCases.length}`}
          sub={`${cases.length} ${lang === 'en' ? 'total incidents' : 'মোট ঘটনা'}`}
          color="amber"
          onClick={() => setTab('cases')}
        />
        <StatCard
          icon={<CloudRain className="h-4 w-4" />}
          label={lang === 'en' ? 'Rainfall (24h)' : 'বৃষ্টিপাত (২৪ঘা)'}
          value={`${maxRain24h.toFixed(1)} mm`}
          sub={anyIncomplete
            ? (lang === 'en' ? '⚠️ Data incomplete' : '⚠️ তথ্য অসম্পূর্ণ')
            : (maxRain24h >= 100
              ? (lang === 'en' ? '🔴 Above danger level' : '🔴 বিপজ্জনক স্তরে')
              : maxRain24h >= 50
                ? (lang === 'en' ? '🟡 Approaching warning' : '🟡 সতর্কতা স্তরে')
                : (lang === 'en' ? '🟢 Normal level' : '🟢 স্বাভাবিক'))
          }
          color={maxRain24h >= 100 ? 'rose' : maxRain24h >= 50 ? 'amber' : 'sky'}
          onClick={() => setTab('preparedness')}
        />
        <StatCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label={lang === 'en' ? 'People at Risk' : 'ঝুঁকিতে মানুষ'}
          value={(data.riskSummary?.red.population ?? 0).toLocaleString()}
          sub={lang === 'en'
            ? `in ${data.riskSummary?.red.count ?? 0} high-risk zones`
            : `${data.riskSummary?.red.count ?? 0} উচ্চ-ঝুঁকি জোনে`}
          color="rose"
          onClick={() => setTab('sites')}
        />
      </div>

      {/* Map + side panel */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2" lang={lang}>
                <MapPin className="h-4 w-4 text-primary" />
                {lang === 'en' ? 'Monitored Hills' : 'পর্যবেক্ষিত পাহাড়'}
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setTab('sites')} className="text-xs" lang={lang}>
                {t.dashboard.viewAll}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RealMap sites={sites} bulletins={bulletins} cases={cases} riskZones={data.riskZones} lang={lang} height={380} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base" lang={lang}>{t.dashboard.recentCases}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto scroll-thin">
            {cases.slice(0, 6).map((c) => (
              <div
                key={c.id}
                className="p-2.5 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-premium transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] font-semibold text-foreground group-hover:text-primary">{c.caseKey}</div>
                    <div className="text-xs text-muted-foreground truncate" lang={lang}>
                      {lang === 'en' ? c.siteNameEn : c.siteNameBn}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {fmtDate(c.detectedAt, lang)} • {c.changedAreaHa?.toFixed(2) ?? '—'} ha
                    </div>
                  </div>
                  <CaseStatusBadge status={c.status} lang={lang} />
                </div>
                <button
                  onClick={() => setTab('cases')}
                  className="mt-2 w-full text-[10px] font-medium text-primary hover:text-primary/80 py-1 rounded border border-primary/20 hover:bg-primary/5 transition-all"
                  lang={lang}
                >
                  {c.status === 'reviewed' || c.status === 'rejected'
                    ? (lang === 'en' ? 'View details →' : 'বিস্তারিত দেখুন →')
                    : (lang === 'en' ? 'Review now →' : 'এখন পর্যালোচনা →')}
                </button>
              </div>
            ))}
            {cases.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8" lang={lang}>
                {lang === 'en' ? 'No cases yet.' : 'কোনো কেস নেই।'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3-day forecast mini-chart (Chashma Hill) */}
      {sites[0] && (
        <DashboardForecastChart siteId={sites[0].id} siteName={lang === 'en' ? sites[0].nameEn : sites[0].nameBn} lang={lang} />
      )}

      {/* Import preview dialog */}
      {importPreview && (
        <ImportPreviewDialog
          data={importPreview.data}
          filename={importPreview.filename}
          lang={lang}
          onClose={() => setImportPreview(null)}
        />
      )}
    </div>
  )
}

// Import preview dialog — shows summary of imported JSON before applying.
function ImportPreviewDialog({
  data,
  filename,
  lang,
  onClose,
}: {
  data: Record<string, unknown>
  filename: string
  lang: Lang
  onClose: () => void
}) {
  const sitesCount = Array.isArray(data.sites) ? data.sites.length : 0
  const casesCount = Array.isArray(data.cases) ? data.cases.length : 0
  const sourcesCount = Array.isArray(data.sources) ? data.sources.length : 0
  const jobsCount = Array.isArray(data.jobs) ? data.jobs.length : 0
  const notificationsCount = Array.isArray(data.notifications) ? data.notifications.length : 0
  const bulletinsCount = Array.isArray(data.bulletins) ? data.bulletins.length : 0

  const summary = [
    { label: 'Sites', labelBn: 'সাইট', count: sitesCount, icon: MapPin },
    { label: 'Cases', labelBn: 'কেস', count: casesCount, icon: FileText },
    { label: 'Sources', labelBn: 'উৎস', count: sourcesCount, icon: Activity },
    { label: 'Jobs', labelBn: 'জব', count: jobsCount, icon: TrendingUp },
    { label: 'Notifications', labelBn: 'বিজ্ঞপ্তি', count: notificationsCount, icon: Activity },
    { label: 'BMD bulletins', labelBn: 'BMD বুলেটিন', count: bulletinsCount, icon: CloudRain },
  ]

  const onApply = () => {
    localStorage.setItem('pp-imported-dashboard', JSON.stringify(data))
    localStorage.setItem('pp-imported-dashboard-time', new Date().toISOString())
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-semibold" lang={lang}>{lang === 'en' ? 'Import preview' : 'ইম্পোর্ট প্রিভিউ'}</div>
              <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[250px]">{filename}</div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">×</Button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3">
          <div className="text-xs text-muted-foreground" lang={lang}>
            {lang === 'en' ? 'This file contains the following data:' : 'এই ফাইলে নিম্নলিখিত ডেটা রয়েছে:'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {summary.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="border border-border rounded-lg p-2.5 bg-card">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                    <Icon className="h-3 w-3" />
                    <span lang={lang}>{lang === 'en' ? s.label : s.labelBn}</span>
                  </div>
                  <div className="text-lg font-bold tabular-nums mt-0.5">{s.count}</div>
                </div>
              )
            })}
          </div>
          <div className="text-[10px] text-muted-foreground/70" lang={lang}>
            {lang === 'en'
              ? 'Importing will store this data in your browser and reload the page. The dashboard will use the imported data instead of fetching from the server.'
              : 'ইম্পোর্ট করলে এই ডেটা আপনার ব্রাউজারে সংরক্ষিত হবে এবং পৃষ্ঠা রিলোড হবে। ড্যাশবোর্ড সার্ভার থেকে না এনে ইম্পোর্ট করা ডেটা ব্যবহার করবে।'}
          </div>
        </div>
        <div className="p-3 border-t border-border flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8">
            {lang === 'en' ? 'Cancel' : 'বাতিল'}
          </Button>
          <Button size="sm" onClick={onApply} className="h-8 gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            {lang === 'en' ? 'Apply & reload' : 'প্রয়োগ ও রিলোড'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'emerald' | 'amber' | 'sky' | 'rose'
  onClick?: () => void
}) {
  const accentColors = {
    emerald: { bar: 'bg-emerald-500', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300', value: 'text-emerald-700 dark:text-emerald-300' },
    amber: { bar: 'bg-amber-500', icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300', value: 'text-amber-700 dark:text-amber-300' },
    sky: { bar: 'bg-sky-500', icon: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300', value: 'text-sky-700 dark:text-sky-300' },
    rose: { bar: 'bg-rose-500', icon: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300', value: 'text-rose-700 dark:text-rose-300' },
  }
  const ac = accentColors[color]
  return (
    <Card
      className={`bg-card border-border/60 shadow-premium ${onClick ? 'cursor-pointer hover:shadow-premium-hover hover:-translate-y-0.5 transition-all' : ''} relative overflow-hidden`}
      onClick={onClick}
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${ac.bar} opacity-80`} />
      <CardContent className="p-4 pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
          <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${ac.icon}`}>{icon}</span>
        </div>
        <div className={`text-3xl font-bold leading-none tabular-nums ${ac.value}`}>{value}</div>
        <div className="text-[10px] text-muted-foreground/80 mt-2 truncate leading-tight">{sub}</div>
      </CardContent>
    </Card>
  )
}

function JobStateMini({ state }: { state: string }) {
  const colors: Record<string, string> = {
    queued: 'bg-slate-300',
    running: 'bg-sky-400 animate-pulse',
    completed: 'bg-emerald-500',
    failed: 'bg-rose-500',
    retry: 'bg-amber-400',
  }
  return (
    <span className={`h-2 w-2 rounded-full ${colors[state] ?? colors.queued}`} title={state} />
  )
}

// Time-of-day greeting in the user's language
function greeting(lang: Lang): string {
  const hour = new Date().getHours()
  if (lang === 'bn') {
    if (hour < 6) return 'শুভ রাত্রি'
    if (hour < 12) return 'শুভ সকাল'
    if (hour < 17) return 'শুভ অপরাহ্ন'
    if (hour < 20) return 'শুভ সন্ধ্যা'
    return 'শুভ রাত্রি'
  }
  if (hour < 6) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 20) return 'Good evening'
  return 'Good night'
}
