'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mountain, CloudRain, AlertTriangle, FileText, Activity, MapPin, TrendingUp, ShieldCheck, Download, Upload } from 'lucide-react'
import type { DashboardDataDTO, Role } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { ChattogramMap } from '@/components/pahar/chattogram-map'
import { ActivityFeed } from '@/components/pahar/activity-feed'
import { SourceHealthSparklines } from '@/components/pahar/source-health-sparklines'
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
                    // Validate it's valid JSON by parsing
                    JSON.parse(json)
                    // Store in localStorage for the dashboard to read
                    localStorage.setItem('pp-imported-dashboard', json)
                    localStorage.setItem('pp-imported-dashboard-time', new Date().toISOString())
                    window.location.reload()
                  } catch {
                    // Invalid JSON — show error via alert (simple for prototype)
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
              <div className="flex-1 py-3 px-4 flex items-start gap-3">
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
                  <div className="text-sm text-amber-800 dark:text-amber-300 mt-0.5 leading-snug" lang={lang}>
                    {lang === 'en' ? topAlert.headlineEn : topAlert.headlineBn}
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
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
                <Button size="sm" variant="outline" onClick={() => setTab('preparedness')} className="shrink-0 self-center border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40">
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Mountain className="h-4 w-4" />}
          label={t.dashboard.siteStatus}
          value={`${sites.length}`}
          sub={
            lang === 'en'
              ? `${sites.filter((s) => s.jurisdiction === 'verified_doe').length} DoE · ${sites.filter((s) => s.jurisdiction === 'verified_forest').length} Forest · ${sites.filter((s) => s.jurisdiction === 'unverified').length} unverified`
              : `${sites.filter((s) => s.jurisdiction === 'verified_doe').length} DoE · ${sites.filter((s) => s.jurisdiction === 'verified_forest').length} ফরেস্ট · ${sites.filter((s) => s.jurisdiction === 'unverified').length} অযাচাইকৃত`
          }
          color="emerald"
        />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label={t.dashboard.activeCases}
          value={`${activeCases.length}`}
          sub={`${cases.length} ${lang === 'en' ? 'total' : 'মোট'}`}
          color="amber"
          onClick={() => setTab('cases')}
        />
        <StatCard
          icon={<CloudRain className="h-4 w-4" />}
          label={t.dashboard.rainfall24h}
          value={`${maxRain24h.toFixed(1)} mm`}
          sub={anyIncomplete ? t.dashboard.incompleteData : (lang === 'en' ? 'As of' : 'হিসাবকাল') + ' ' + fmtDateOnly(sites[0] ? rainfallSummary[sites[0].id]?.asOf : null, lang)}
          color={anyIncomplete ? 'amber' : 'sky'}
          onClick={() => setTab('preparedness')}
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label={t.dashboard.sourceHealth}
          value={`${liveSources}/${sources.length}`}
          sub={lang === 'en' ? `${replaySources} replay · ${unavailableSources} unavailable` : `${replaySources} রিপ্লে · ${unavailableSources} অনুপলব্ধ`}
          color={unavailableSources > 0 ? 'amber' : 'emerald'}
          onClick={() => setTab('sources')}
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
            <ChattogramMap sites={sites} bulletins={bulletins} cases={cases} lang={lang} height={380} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base" lang={lang}>{t.dashboard.recentCases}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto scroll-thin">
            {cases.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onClick={() => setTab('cases')}
                className="w-full text-left p-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
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
              </button>
            ))}
            {cases.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8" lang={lang}>
                {lang === 'en' ? 'No cases yet.' : 'কোনো কেস নেই।'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sources + Jobs mini panels */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base" lang={lang}>{t.dashboard.sourceHealth}</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setTab('sources')} className="text-xs" lang={lang}>
                {t.dashboard.viewAll}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[260px] overflow-y-auto scroll-thin">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs py-2 border-b border-border/40 last:border-0 gap-2">
                <div className="font-mono text-[11px] text-foreground truncate flex items-center gap-2 min-w-0">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.accessState === 'live' ? 'bg-emerald-500 animate-pulse' : s.accessState === 'historical_replay' ? 'bg-sky-400' : s.accessState === 'unavailable' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                  <span className="truncate">{s.adapter}</span>
                </div>
                <AccessStateBadge state={s.accessState} lang={lang} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2" lang={lang}>
                <TrendingUp className="h-4 w-4 text-primary" />
                {t.nav.jobs}
              </CardTitle>
              <div className="flex items-center gap-1.5">
                {runningJobs.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    {runningJobs.length} {lang === 'en' ? 'active' : 'সক্রিয়'}
                  </span>
                )}
                {failedJobs.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    {failedJobs.length} {lang === 'en' ? 'failed' : 'ব্যর্থ'}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[260px] overflow-y-auto scroll-thin">
            {jobs.slice(0, 6).map((j) => (
              <div key={j.id} className="flex items-center justify-between text-xs py-2 border-b border-border/40 last:border-0 gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] text-foreground truncate">{j.jobKey}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{j.jobType} · {relativeTime(j.updatedAt, lang)}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <JobStateMini state={j.state} />
                  <span className="text-[9px] text-muted-foreground capitalize hidden sm:inline">{j.state}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity feed + source health sparklines */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ActivityFeed lang={lang} height={320} />
        <SourceHealthSparklines lang={lang} />
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
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  }
  const iconWrap = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300',
    sky: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300',
    rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300',
  }
  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all' : ''} ${colors[color]}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</span>
          <span className={`h-6 w-6 rounded-md flex items-center justify-center ${iconWrap[color]}`}>{icon}</span>
        </div>
        <div className="text-2xl font-bold leading-none tabular-nums">{value}</div>
        <div className="text-[10px] opacity-70 mt-1.5 truncate leading-tight">{sub}</div>
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
