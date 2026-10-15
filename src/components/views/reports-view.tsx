'use client'

// PaharPahara — Reports view.
// Lists report versions with summary stats, integrity info, and a version-diff
// drawer when a case has multiple versions.

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  ExternalLink,
  Fingerprint,
  History,
  ShieldCheck,
  Clock,
  GitCompare,
  ScrollText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import type { DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { fmtDate, relativeTime } from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
}

interface FlatReport {
  id: string
  version: number
  status: string
  factSnapshotJson: string
  pdfUri: string | null
  pdfSha256: string | null
  createdAt: string
  requestedById: string | null
  caseId: string
  caseKey: string
  siteNameEn: string
  siteNameBn: string
  caseStatus: string
}

export function ReportsView({ data, lang }: Props) {
  const t = dict[lang]
  const [diffPair, setDiffPair] = useState<{ left: FlatReport; right: FlatReport } | null>(null)

  // Flatten report versions across cases
  const reports = useMemo<FlatReport[]>(
    () =>
      data.cases
        .flatMap((c) =>
          c.reportVersions.map((r) => ({
            id: r.id,
            version: r.version,
            status: r.status,
            factSnapshotJson: r.factSnapshotJson,
            pdfUri: r.pdfUri,
            pdfSha256: r.pdfSha256,
            createdAt: r.createdAt,
            requestedById: r.requestedById,
            caseId: c.id,
            caseKey: c.caseKey,
            siteNameEn: c.siteNameEn,
            siteNameBn: c.siteNameBn,
            caseStatus: c.status,
          })),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.cases],
  )

  // Cases that have multiple report versions (diff-eligible)
  const multiVersionCases = useMemo(() => {
    const byCase = new Map<string, FlatReport[]>()
    for (const r of reports) {
      if (!byCase.has(r.caseId)) byCase.set(r.caseId, [])
      byCase.get(r.caseId)!.push(r)
    }
    return Array.from(byCase.entries()).filter(([, rs]) => rs.length >= 2)
  }, [reports])

  // Stats
  const reviewedCount = reports.filter((r) => r.status === 'reviewed').length
  const draftCount = reports.filter((r) => r.status === 'draft').length
  const fieldCorroboratedCount = reports.filter((r) => r.status === 'field_corroborated').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" lang={lang}>
            <FileText className="h-6 w-6 text-primary" />
            {t.report.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" lang={lang}>{t.report.list}</p>
        </div>
        {multiVersionCases.length > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1.5 bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/30 dark:border-violet-800 dark:text-violet-300">
            <GitCompare className="h-3 w-3" />
            {multiVersionCases.length} {lang === 'en' ? 'case(s) with multiple versions' : 'কেস একাধিক সংস্করণ সহ'}
          </Badge>
        )}
      </div>

      {/* Stats row */}
      {reports.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{lang === 'en' ? 'Total reports' : 'মোট রিপোর্ট'}</span>
                <span className="h-6 w-6 rounded-md flex items-center justify-center bg-primary/10 text-primary"><ScrollText className="h-3.5 w-3.5" /></span>
              </div>
              <div className="text-2xl font-bold tabular-nums">{reports.length}</div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.status.reviewed}</span>
                <span className="h-6 w-6 rounded-md flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /></span>
              </div>
              <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{reviewedCount}</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.status.draft}</span>
                <span className="h-6 w-6 rounded-md flex items-center justify-center bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300"><Clock className="h-3.5 w-3.5" /></span>
              </div>
              <div className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">{draftCount}</div>
            </CardContent>
          </Card>
          <Card className="border-teal-200 bg-teal-50/40 dark:bg-teal-950/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.status.fieldCorroborated}</span>
                <span className="h-6 w-6 rounded-md flex items-center justify-center bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300"><ShieldCheck className="h-3.5 w-3.5" /></span>
              </div>
              <div className="text-2xl font-bold tabular-nums text-teal-700 dark:text-teal-300">{fieldCorroboratedCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports list — group by case */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="inline-flex h-14 w-14 rounded-full bg-muted items-center justify-center mb-3">
              <FileText className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-1" lang={lang}>{t.report.noReports}</p>
            <p className="text-xs text-muted-foreground/70" lang={lang}>
              {lang === 'en' ? 'Open a case under Cases → Review → Request report.' : 'কেস → পর্যালোচনা → রিপোর্ট অনুরোধ এ খুলুন।'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Group by case */}
          {Array.from(new Set(reports.map((r) => r.caseId))).map((caseId) => {
            const caseReports = reports.filter((r) => r.caseId === caseId).sort((a, b) => b.version - a.version)
            const first = caseReports[0]
            const hasMultiple = caseReports.length >= 2
            return (
              <Card key={caseId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-mono truncate">{first.caseKey}</CardTitle>
                        <div className="text-[10px] text-muted-foreground" lang={lang}>
                          {lang === 'en' ? first.siteNameEn : first.siteNameBn}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[9px]">
                        {caseReports.length} {lang === 'en' ? 'version(s)' : 'সংস্করণ'}
                      </Badge>
                      {hasMultiple && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => setDiffPair({ left: caseReports[1], right: caseReports[0] })}
                        >
                          <GitCompare className="h-3 w-3" />
                          {lang === 'en' ? 'Diff' : 'পার্থক্য'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {caseReports.map((r) => (
                      <div
                        key={r.id}
                        className="border border-border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-muted-foreground">v{r.version}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] capitalize ${
                                r.status === 'reviewed'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                  : r.status === 'field_corroborated'
                                    ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300'
                                    : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                              }`}
                            >
                              {r.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground" title={fmtDate(r.createdAt, lang)}>
                            {relativeTime(r.createdAt, lang)}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {fmtDate(r.createdAt, lang)}
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Fingerprint className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="font-mono text-[9.5px] text-muted-foreground break-all leading-tight">
                            {r.pdfSha256?.slice(0, 28)}…
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-auto h-7 text-[11px]"
                          onClick={() => window.open(`/api/reports/${r.id}?format=html&lang=${lang}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1.5" />
                          {t.report.openPrintable}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Integrity explainer */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <ShieldCheck className="h-4 w-4 text-primary" />
            {lang === 'en' ? 'About report integrity' : 'রিপোর্ট অখণ্ডতা সম্পর্কে'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2" lang={lang}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
            <p>
              {lang === 'en'
                ? 'Each report version freezes a fact snapshot at request time. Refreshing data cannot alter an old report. The SHA-256 hash detects changed bytes; it does not prove a source claim is true.'
                : 'প্রতিটি রিপোর্ট সংস্করণ অনুরোধের সময় একটি ফ্যাক্ট স্ন্যাপশট ফ্রিজ করে। ডেটা রিফ্রেশ করলে পুরোনো রিপোর্ট পরিবর্তিত হয় না। SHA-256 হ্যাশ পরিবর্তিত বাইট সনাক্ত করে; এটি উৎস দাবি সত্য প্রমাণ করে না।'}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <History className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            <p>
              {lang === 'en'
                ? 'Reports are decision-support documents. They are not legal conclusions or courtroom-admissible proof. Permit/clearance verification under ECA 6B remains with the authorized enforcement authority.'
                : 'রিপোর্ট সিদ্ধান্ত-সহায়ক নথি। এগুলো আইনি সিদ্ধান্ত বা আদালতে গ্রহণযোগ্য প্রমাণ নয়। ECA 6B এর অধীনে অনুমতি/ক্লিয়ারেন্স যাচাই অনুমোদিত এনফোর্সমেন্ট কর্তৃপক্ষের কাছে থাকে।'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Diff drawer */}
      {diffPair && (
        <ReportDiffDrawer pair={diffPair} lang={lang} onClose={() => setDiffPair(null)} />
      )}
    </div>
  )
}

// Compare two report versions' fact snapshots field-by-field.
function ReportDiffDrawer({
  pair,
  lang,
  onClose,
}: {
  pair: { left: FlatReport; right: FlatReport }
  lang: Lang
  onClose: () => void
}) {
  const t = dict[lang]
  const { left, right } = pair

  let leftSnap: Record<string, unknown> = {}
  let rightSnap: Record<string, unknown> = {}
  try {
    leftSnap = JSON.parse(left.factSnapshotJson) as Record<string, unknown>
  } catch {
    /* ignore */
  }
  try {
    rightSnap = JSON.parse(right.factSnapshotJson) as Record<string, unknown>
  } catch {
    /* ignore */
  }

  const allKeys = Array.from(new Set([...Object.keys(leftSnap), ...Object.keys(rightSnap)])).sort()

  const fmtVal = (v: unknown): string => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'object') return JSON.stringify(v).slice(0, 60) + (JSON.stringify(v).length > 60 ? '…' : '')
    return String(v)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <GitCompare className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold font-mono truncate">{left.caseKey}</div>
              <div className="text-[10px] text-muted-foreground" lang={lang}>
                {lang === 'en' ? 'Comparing' : 'তুলনা'} v{left.version} → v{right.version}
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">×</Button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-4">
          <div className="grid grid-cols-[1fr_2fr_2fr] gap-x-3 gap-y-1 text-xs">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground col-span-1">Field</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              v{left.version} <span className="opacity-60">({relativeTime(left.createdAt, lang)})</span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              v{right.version} <span className="opacity-60">({relativeTime(right.createdAt, lang)})</span>
            </div>
            <div className="col-span-3 border-b border-border mb-1" />
            {allKeys.map((key) => {
              const lv = fmtVal(leftSnap[key])
              const rv = fmtVal(rightSnap[key])
              const changed = lv !== rv
              return (
                <div key={key} className="contents">
                  <div className={`font-mono text-[10px] py-1.5 ${changed ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{key}</div>
                  <div className={`py-1.5 px-2 rounded ${changed ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 line-through' : 'text-muted-foreground'}`}>
                    {lv}
                  </div>
                  <div className={`py-1.5 px-2 rounded ${changed ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium' : 'text-muted-foreground'}`}>
                    {rv}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="p-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-rose-400" /> {lang === 'en' ? 'removed/changed' : 'অপসারিত/পরিবর্তিত'}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-emerald-400" /> {lang === 'en' ? 'new value' : 'নতুন মান'}
            </span>
          </div>
          <span className="font-mono">{allKeys.length} {lang === 'en' ? 'fields' : 'ক্ষেত্র'}</span>
        </div>
      </div>
    </div>
  )
}
