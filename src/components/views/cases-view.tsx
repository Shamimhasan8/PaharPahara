'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, FileText, AlertTriangle, ShieldCheck, History, ChevronRight, ArrowLeft, Lock, Fingerprint, Activity, Layers, Search, X, Link2, Calendar, CheckSquare, Zap, CheckCircle2, AlertCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CaseDTO, DashboardDataDTO, Role } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { BeforeAfterSlider } from '@/components/pahar/before-after-slider'
import { CaseTimeline } from '@/components/pahar/case-timeline'
import {
  CaseStatusBadge,
  AccessStateBadge,
  fmtDate,
  fmtDateOnly,
  relativeTime,
} from '@/components/pahar/badges'
import { can } from '@/lib/auth'

interface Props {
  data: DashboardDataDTO
  lang: Lang
  role: Role
  reload: () => void
  initialSelectedId?: string | null
  onSelectedChange?: (id: string | null) => void
}

const STATUS_FILTERS = ['all', 'active', 'candidate', 'under_review', 'field_verification', 'reviewed', 'rejected', 'field_corroborated'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

export function CasesView({ data, lang, role, reload, initialSelectedId, onSelectedChange }: Props) {
  const t = dict[lang]
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null)
  const [filter, setFilter] = useState<StatusFilter>('active')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)

  // Notify parent when selection changes (for URL hash sync)
  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id)
    onSelectedChange?.(id)
  }, [onSelectedChange])

  const selected = data.cases.find((c) => c.id === selectedId) ?? null

  const filteredCases = data.cases.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'active') return !['reviewed', 'rejected'].includes(c.status)
    return c.status === filter
  }).filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      c.caseKey.toLowerCase().includes(q) ||
      c.siteNameEn.toLowerCase().includes(q) ||
      c.siteNameBn.includes(q) ||
      c.disturbanceType?.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    )
  }).filter((c) => {
    // Date range filter on detectedAt
    const d = new Date(c.detectedAt)
    if (dateFrom && d < new Date(dateFrom + 'T00:00:00Z')) return false
    if (dateTo && d > new Date(dateTo + 'T23:59:59Z')) return false
    return true
  })

  const canReview = can(role, 'review_case')

  const toggleBulk = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    setBulkSelected(new Set(filteredCases.map((c) => c.id)))
  }

  const clearBulk = () => {
    setBulkSelected(new Set())
    setBulkMode(false)
  }

  if (selected) {
    return <CaseDetail c={selected} lang={lang} role={role} onBack={() => handleSelect(null)} reload={reload} sources={data.sources} />
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" lang={lang}>{t.case.title}</h1>
        <p className="text-sm text-muted-foreground mt-1" lang={lang}>{t.dashboard.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {STATUS_FILTERS.map((f) => {
            const count = f === 'all' ? data.cases.length : f === 'active' ? data.cases.filter((c) => !['reviewed', 'rejected'].includes(c.status)).length : data.cases.filter((c) => c.status === f).length
            const labels: Record<string, string> = {
              all: t.common.all,
              active: lang === 'en' ? 'Active' : 'সক্রিয়',
              candidate: t.status.candidate,
              under_review: t.status.underReview,
              field_verification: t.status.fieldVerification,
              reviewed: t.status.reviewed,
              rejected: t.status.rejected,
              field_corroborated: t.status.fieldCorroborated,
            }
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filter === f
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {labels[f]} <span className="opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'en' ? 'Search case, site, type…' : 'কেস, সাইট, ধরন খুঁজুন…'}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t.common.close}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Date range + bulk mode controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span lang={lang}>{lang === 'en' ? 'Detected' : 'সনাক্তকরণ'}:</span>
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          aria-label={lang === 'en' ? 'From date' : 'শুরু তারিখ'}
        />
        <span className="text-xs text-muted-foreground">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          aria-label={lang === 'en' ? 'To date' : 'শেষ তারিখ'}
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo('') }}
            className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <div className="flex-1" />
        {canReview && (
          <>
            {!bulkMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkMode(true)}
                className="h-8 text-xs gap-1.5"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span lang={lang}>{lang === 'en' ? 'Bulk select' : 'বাল্ক নির্বাচন'}</span>
              </Button>
            ) : (
              <>
                <Badge variant="outline" className="text-[10px] gap-1.5">
                  <CheckSquare className="h-3 w-3" />
                  {bulkSelected.size} {lang === 'en' ? 'selected' : 'নির্বাচিত'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllFiltered}
                  className="h-8 text-xs"
                  disabled={filteredCases.length === 0}
                >
                  {lang === 'en' ? 'Select all' : 'সব নির্বাচন'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setBulkDialogOpen(true)}
                  className="h-8 text-xs gap-1.5"
                  disabled={bulkSelected.size === 0}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {lang === 'en' ? 'Apply bulk action' : 'বাল্ক কর্ম প্রয়োগ'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearBulk}
                  className="h-8 text-xs"
                >
                  {lang === 'en' ? 'Exit' : 'প্রস্থান'}
                </Button>
              </>
            )}
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base" lang={lang}>{lang === 'en' ? 'Cases' : 'কেস'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-[600px] overflow-y-auto scroll-thin p-3">
            {filteredCases.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground" lang={lang}>
                {lang === 'en' ? 'No cases match this filter.' : 'এই ফিল্টারে কোনো কেস নেই।'}
              </div>
            ) : (
              filteredCases.map((c) => {
                const isBulkSel = bulkSelected.has(c.id)
                return (
                  <div
                    key={c.id}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors group flex items-start gap-2 ${
                      bulkMode && isBulkSel
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-muted/50 hover:border-primary/50'
                    } ${bulkMode ? 'cursor-pointer' : ''}`}
                    onClick={bulkMode ? () => toggleBulk(c.id) : () => handleSelect(c.id)}
                  >
                    {bulkMode && (
                      <Checkbox
                        checked={isBulkSel}
                        onCheckedChange={() => toggleBulk(c.id)}
                        className="mt-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[11px] font-semibold group-hover:text-primary">{c.caseKey}</div>
                      <div className="text-xs text-muted-foreground truncate" lang={lang}>
                        {lang === 'en' ? c.siteNameEn : c.siteNameBn}
                      </div>
                      <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {fmtDate(c.detectedAt, lang)} • {c.changedAreaHa?.toFixed(2) ?? '—'} ha
                      </div>
                    </div>
                    <CaseStatusBadge status={c.status} lang={lang} />
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="py-16 text-center">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-base font-medium text-foreground mb-1" lang={lang}>
              {lang === 'en' ? 'Select a case to begin' : 'শুরু করতে একটি কেস নির্বাচন করুন'}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto" lang={lang}>
              {lang === 'en'
                ? 'Click any case from the list on the left to view before/after satellite imagery, change metrics, and record your review decision.'
                : 'পূর্ব/পরবর্তী স্যাটেলাইট চিত্র, পরিবর্তন মেট্রিক্স দেখতে এবং আপনার পর্যালোচনা সিদ্ধান্ত লিপিবদ্ধ করতে বাম দিকের তালিকা থেকে একটি কেসে ক্লিক করুন।'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-muted-foreground/60">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono">←</kbd>
              <span lang={lang}>{lang === 'en' ? 'Click a case from the list' : 'তালিকা থেকে একটি কেসে ক্লিক করুন'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk action dialog */}
      {bulkDialogOpen && (
        <BulkActionDialog
          caseIds={Array.from(bulkSelected)}
          cases={data.cases.filter((c) => bulkSelected.has(c.id))}
          lang={lang}
          onClose={() => setBulkDialogOpen(false)}
          onSuccess={() => {
            setBulkDialogOpen(false)
            clearBulk()
            reload()
          }}
        />
      )}
    </div>
  )
}

// Bulk action dialog — applies the same decision to multiple cases.
function BulkActionDialog({
  caseIds,
  cases,
  lang,
  onClose,
  onSuccess,
}: {
  caseIds: string[]
  cases: CaseDTO[]
  lang: Lang
  onClose: () => void
  onSuccess: () => void
}) {
  const t = dict[lang]
  const [decision, setDecision] = useState('')
  const [rationale, setRationale] = useState('')
  const [permitStatus, setPermitStatus] = useState('unverified')
  const [nextAction, setNextAction] = useState('')

  const [results, setResults] = useState<{ succeeded: number; failed: number; results: Array<{ caseId: string; caseKey: string; ok: boolean; error?: string; newStatus?: string }> } | null>(null)

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cases/bulk-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ caseIds, decision, rationale, permitStatus, nextAction }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'failed')
      }
      return res.json()
    },
    onSuccess: (data: { succeeded: number; failed: number; results: Array<{ caseId: string; caseKey: string; ok: boolean; error?: string; newStatus?: string }> }) => {
      setResults(data)
      toast.success(
        lang === 'en'
          ? `Bulk action applied: ${data.succeeded} succeeded, ${data.failed} failed`
          : `বাল্ক কর্ম প্রয়োগ: ${data.succeeded} সফল, ${data.failed} ব্যর্থ`,
      )
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onSubmit = () => {
    if (!decision || !rationale.trim()) {
      toast.error(lang === 'en' ? 'Select a decision and provide rationale' : 'সিদ্ধান্ত ও যৌক্তিকতা দিন')
      return
    }
    bulkMutation.mutate()
  }

  // Show available decisions based on the most common status among selected cases
  const statusCounts: Record<string, number> = {}
  for (const c of cases) statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1
  const dominantStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'under_review'

  const allowedDecisions: Record<string, Array<{ value: string; labelEn: string; labelBn: string }>> = {
    candidate: [
      { value: 'needs_more_evidence', labelEn: 'Move to under review', labelBn: 'পর্যালোচনাধীনে নিন' },
      { value: 'rejected', labelEn: 'Reject', labelBn: 'প্রত্যাখ্যান' },
    ],
    under_review: [
      { value: 'field_verification_requested', labelEn: 'Request field verification', labelBn: 'ফিল্ড যাচাই অনুরোধ' },
      { value: 'approved', labelEn: 'Approve (mark reviewed)', labelBn: 'অনুমোদন (পর্যালোচিত)' },
      { value: 'rejected', labelEn: 'Reject', labelBn: 'প্রত্যাখ্যান' },
    ],
    field_verification: [
      { value: 'approved', labelEn: 'Approve (mark reviewed)', labelBn: 'অনুমোদন (পর্যালোচিত)' },
      { value: 'rejected', labelEn: 'Reject', labelBn: 'প্রত্যাখ্যান' },
    ],
    field_corroborated: [
      { value: 'approved', labelEn: 'Approve (mark reviewed)', labelBn: 'অনুমোদন (পর্যালোচিত)' },
      { value: 'rejected', labelEn: 'Reject', labelBn: 'প্রত্যাখ্যান' },
    ],
    rejected: [
      { value: 'needs_more_evidence', labelEn: 'Reopen as under review', labelBn: 'পুনরায় খোলা' },
    ],
    reviewed: [],
  }
  const decisionOptions = allowedDecisions[dominantStatus] ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-semibold" lang={lang}>{lang === 'en' ? 'Bulk action' : 'বাল্ক কর্ম'}</div>
              <div className="text-[10px] text-muted-foreground" lang={lang}>
                {caseIds.length} {lang === 'en' ? 'case(s) selected' : 'কেস নির্বাচিত'}
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">×</Button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3">
          {/* Selected cases preview */}
          <div className="border border-border rounded-lg p-2 bg-muted/30 max-h-[120px] overflow-y-auto scroll-thin">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1" lang={lang}>
              {lang === 'en' ? 'Selected cases' : 'নির্বাচিত কেস'}
            </div>
            <div className="space-y-0.5">
              {cases.map((c) => (
                <div key={c.id} className="text-[11px] font-mono flex items-center justify-between gap-2">
                  <span className="truncate">{c.caseKey}</span>
                  <span className="text-muted-foreground text-[9px] capitalize shrink-0">{c.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {decisionOptions.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-4" lang={lang}>
              {lang === 'en'
                ? `Dominant status "${dominantStatus}" allows no further bulk actions.`
                : `প্রধান অবস্থা "${dominantStatus}" এর জন্য কোনো বাল্ক কর্ম নেই।`}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs" lang={lang}>
                  {lang === 'en' ? 'Decision' : 'সিদ্ধান্ত'}{' '}
                  <span className="text-muted-foreground/70">({lang === 'en' ? 'based on dominant status' : 'প্রধান অবস্থার উপর ভিত্তি'})</span>
                </Label>
                <Select value={decision} onValueChange={setDecision}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder={lang === 'en' ? 'Select…' : 'নির্বাচন…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {decisionOptions.map((d) => (
                      <SelectItem key={d.value} value={d.value} className="text-xs">
                        {lang === 'en' ? d.labelEn : d.labelBn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" lang={lang}>{lang === 'en' ? 'Permit status' : 'অনুমতি অবস্থা'}</Label>
                <Select value={permitStatus} onValueChange={setPermitStatus}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified" className="text-xs">Verified</SelectItem>
                    <SelectItem value="unverified" className="text-xs">Unverified</SelectItem>
                    <SelectItem value="missing" className="text-xs">Missing</SelectItem>
                    <SelectItem value="not_applicable" className="text-xs">Not applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" lang={lang}>{lang === 'en' ? 'Rationale (applies to all)' : 'যৌক্তিকতা (সবার জন্য)'}</Label>
                <Textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  rows={3}
                  placeholder={lang === 'en' ? 'Document the shared evidence basis…' : 'শেয়ার্ড প্রমাণ ভিত্তি লিপিবদ্ধ করুন…'}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" lang={lang}>{lang === 'en' ? 'Next action' : 'পরবর্তী পদক্ষেপ'}</Label>
                <Textarea
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </>
          )}

          {/* Results breakdown after bulk action */}
          {results && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2.5 py-1.5 bg-muted/40 border-b border-border" lang={lang}>
                {lang === 'en' ? 'Per-case results' : 'প্রতি-কেস ফলাফল'}
              </div>
              <div className="max-h-[200px] overflow-y-auto scroll-thin divide-y divide-border/50">
                {results.results.map((r) => (
                  <div key={r.caseId} className="flex items-start gap-2 px-2.5 py-1.5 text-[11px]">
                    {r.ok ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] font-medium truncate">{r.caseKey}</div>
                      {r.ok ? (
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-300 capitalize">
                          → {r.newStatus?.replace(/_/g, ' ')}
                        </div>
                      ) : (
                        <div className="text-[9px] text-rose-600 dark:text-rose-300">{r.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-border flex items-center justify-between gap-2">
          {results ? (
            <>
              <div className="text-[10px] text-muted-foreground flex items-center gap-3" lang={lang}>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {results.succeeded} {lang === 'en' ? 'succeeded' : 'সফল'}
                </span>
                {results.failed > 0 && (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-300">
                    <AlertCircle className="h-3 w-3" />
                    {results.failed} {lang === 'en' ? 'failed' : 'ব্যর্থ'}
                  </span>
                )}
              </div>
              <Button size="sm" onClick={onSuccess} className="h-8">
                {lang === 'en' ? 'Done' : 'সম্পন্ন'}
              </Button>
            </>
          ) : (
            <>
              <div className="text-[10px] text-muted-foreground" lang={lang}>
                {lang === 'en' ? 'Each case is validated individually; failures do not abort the batch.' : 'প্রতিটি কেস আলাদাভাবে যাচাই; ব্যর্থতা ব্যাচ বাতিল করে না।'}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={onClose} className="h-8">
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </Button>
                {decisionOptions.length > 0 && (
                  <Button size="sm" onClick={onSubmit} disabled={bulkMutation.isPending} className="h-8">
                    {bulkMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    {lang === 'en' ? `Apply to ${caseIds.length}` : `${caseIds.length} এ প্রয়োগ`}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CaseDetail({
  c,
  lang,
  role,
  onBack,
  reload,
  sources,
}: {
  c: CaseDTO
  lang: Lang
  role: Role
  onBack: () => void
  reload: () => void
  sources: DashboardDataDTO['sources']
}) {
  const t = dict[lang]
  const [decision, setDecision] = useState<string>('')
  const [rationale, setRationale] = useState('')
  const [permitStatus, setPermitStatus] = useState<string>('unverified')
  const [nextAction, setNextAction] = useState('')

  const canReview = can(role, 'review_case')
  const canRequestReport = can(role, 'request_report')

  // Map case status to allowed decisions
  const allowedDecisions: Record<string, Array<{ value: string; labelEn: string; labelBn: string }>> = {
    candidate: [
      { value: 'needs_more_evidence', labelEn: 'Move to under review', labelBn: 'পর্যালোচনাধীনে নিন' },
      { value: 'rejected', labelEn: 'Reject', labelBn: 'প্রত্যাখ্যান' },
    ],
    under_review: [
      { value: 'field_verification_requested', labelEn: 'Request field verification', labelBn: 'ফিল্ড যাচাই অনুরোধ' },
      { value: 'approved', labelEn: 'Approve (mark reviewed)', labelBn: 'অনুমোদন (পর্যালোচিত)' },
      { value: 'rejected', labelEn: 'Reject', labelBn: 'প্রত্যাখ্যান' },
    ],
    field_verification: [
      ...(role === 'forest_officer' || role === 'admin'
        ? [{ value: 'field_corroborated', labelEn: 'Field corroborate', labelBn: 'ফিল্ড করোবোরেট' }]
        : []),
      { value: 'rejected', labelEn: 'Reject', labelBn: 'প্রত্যাখ্যান' },
    ],
    field_corroborated: [
      { value: 'approved', labelEn: 'Approve (mark reviewed)', labelBn: 'অনুমোদন (পর্যালোচিত)' },
      { value: 'rejected', labelEn: 'Reject', labelBn: 'প্রত্যাখ্যান' },
    ],
    rejected: [
      { value: 'needs_more_evidence', labelEn: 'Reopen as under review', labelBn: 'পুনরায় খোলা' },
    ],
    reviewed: [],
  }
  const decisionOptions = allowedDecisions[c.status] ?? []

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cases/${c.id}/review`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          decision,
          rationale,
          permitStatus,
          nextAction,
          expectedRevision: c.revision,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || 'failed')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(lang === 'en' ? 'Decision recorded' : 'সিদ্ধান্ত লিপিবদ্ধ হয়েছে')
      setDecision('')
      setRationale('')
      setNextAction('')
      reload()
      onBack()
    },
    onError: (e: Error) => {
      toast.error(e.message || t.case.revisionConflict)
    },
  })

  const reportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cases/${c.id}/report`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lang }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'failed')
      }
      return res.json()
    },
    onSuccess: (data: { version: number }) => {
      toast.success(lang === 'en' ? `Report v${data.version} queued` : `রিপোর্ট v${data.version} সারিবদ্ধ`)
      reload()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onSubmit = () => {
    if (!decision || !rationale.trim()) {
      toast.error(lang === 'en' ? 'Select a decision and provide rationale' : 'সিদ্ধান্ত ও যৌক্তিকতা দিন')
      return
    }
    reviewMutation.mutate()
  }

  const onDownloadReport = (reportId: string) => {
    window.open(`/api/reports/${reportId}?format=html&lang=${lang}`, '_blank')
  }

  const onCopyLink = () => {
    const url = `${window.location.origin}/#tab=cases&case=${c.id}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success(lang === 'en' ? 'Link copied to clipboard' : 'লিংক ক্লিপবোর্ডে কপি হয়েছে')
    }).catch(() => {
      toast.error(lang === 'en' ? 'Failed to copy link' : 'লিংক কপি ব্যর্থ')
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          <span lang={lang}>{t.common.back}</span>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold font-mono">{c.caseKey}</h1>
            <CaseStatusBadge status={c.status} lang={lang} />
            <Badge variant="outline" className="text-[10px]">
              {lang === 'en' ? 'Revision' : 'রিভিশন'} {c.revision}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyLink}
              className="h-7 px-2 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              title={lang === 'en' ? 'Copy link' : 'লিংক কপি'}
            >
              <Link2 className="h-3 w-3" />
              <span className="hidden sm:inline">{lang === 'en' ? 'Copy link' : 'লিংক'}</span>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1" lang={lang}>
            {lang === 'en' ? c.siteNameEn : c.siteNameBn} • {t.case.detectedAt}: {fmtDate(c.detectedAt, lang)}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left column: evidence */}
        <div className="lg:col-span-2 space-y-4">
          {/* Before/After slider */}
          {c.beforeAsset && c.afterAsset && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base" lang={lang}>{t.case.beforeAfter}</CardTitle>
                <CardDescription className="text-xs">
                  {lang === 'en'
                    ? 'Drag the handle to compare. Common valid coverage shown below.'
                    : 'তুলনা করতে হ্যান্ডেল টানুন। সাধারণ বৈধ কভারেজ নিচে।'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BeforeAfterSlider
                  beforeSrc={c.beforeAsset.fileUri}
                  afterSrc={c.afterAsset.fileUri}
                  beforeLabel={`${t.case.before} • ${fmtDateOnly(c.beforeAsset.acquiredAt, lang)}`}
                  afterLabel={`${t.case.after} • ${fmtDateOnly(c.afterAsset.acquiredAt, lang)}`}
                  height={320}
                  hint={lang === 'en' ? 'Historical replay placeholder chip' : 'ঐতিহাসিক রিপ্লে প্লেসহোল্ডার চিপ'}
                />
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="border border-border rounded p-2 bg-muted/30">
                    <div className="text-[10px] text-muted-foreground uppercase">{t.case.before}</div>
                    <div className="font-mono text-[10px]">{c.beforeAsset.providerAssetId}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {t.case.coveragePct}: {c.beforeAsset.coveragePct ?? '—'}% • QA: {c.beforeAsset.qaStatus}
                    </div>
                  </div>
                  <div className="border border-border rounded p-2 bg-muted/30">
                    <div className="text-[10px] text-muted-foreground uppercase">{t.case.after}</div>
                    <div className="font-mono text-[10px]">{c.afterAsset.providerAssetId}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {t.case.coveragePct}: {c.afterAsset.coveragePct ?? '—'}% • QA: {c.afterAsset.qaStatus}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Change metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2" lang={lang}>
                <Activity className="h-4 w-4 text-primary" />
                {lang === 'en' ? 'Change metrics' : 'পরিবর্তন মেট্রিক্স'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Metric label={t.case.changedArea} value={`${c.changedAreaHa?.toFixed(2) ?? '—'} ha`} tone={c.changedAreaHa && c.changedAreaHa > 0.5 ? 'warn' : 'default'} />
                <Metric label={t.case.ndviDelta} value={c.ndviDelta?.toFixed(2) ?? '—'} tone={c.ndviDelta && c.ndviDelta < -0.15 ? 'warn' : 'default'} />
                <Metric label={t.case.bareSoilDelta} value={c.bareSoilDelta?.toFixed(2) ?? '—'} tone={c.bareSoilDelta && c.bareSoilDelta > 0.15 ? 'warn' : 'default'} />
                <Metric label={t.case.dwTreeProbDelta} value={c.dwTreeProbDelta?.toFixed(2) ?? '—'} tone={c.dwTreeProbDelta && c.dwTreeProbDelta < -0.15 ? 'warn' : 'default'} />
                <Metric label={t.case.dwBareProbDelta} value={c.dwBareProbDelta?.toFixed(2) ?? '—'} tone={c.dwBareProbDelta && c.dwBareProbDelta > 0.15 ? 'warn' : 'default'} />
                <Metric label={t.case.coverage} value={`${c.coveragePct?.toFixed(0) ?? '—'}%`} tone={c.coveragePct && c.coveragePct < 75 ? 'warn' : 'default'} />
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t.case.disturbanceType}:</span>{' '}
                  <span className="font-medium capitalize">{c.disturbanceType ? c.disturbanceType.replace(/_/g, ' ') : '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.case.methodVersion}:</span>{' '}
                  <span className="font-mono text-[10px]">{c.methodVersion ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.case.screeningRule}:</span>{' '}
                  <span className="font-mono text-[10px]">{c.screeningRule ?? '—'}</span>
                </div>
              </div>
              {c.uncertaintyNotes && (
                <div className="mt-3 p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200" lang={lang}>
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                  {t.case.uncertainty}: <span className="font-normal">{c.uncertaintyNotes}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provenance / assets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2" lang={lang}>
                <Layers className="h-4 w-4 text-primary" />
                {t.case.provenance}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[c.beforeAsset, c.afterAsset].filter(Boolean).map((a) => (
                <div key={a!.id} className="text-xs border border-border rounded p-2 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] font-medium">{a!.adapter}</div>
                    <Badge variant="outline" className="text-[9px]">{a!.product}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-mono">{a!.providerAssetId}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 text-[10px]">
                    <div><span className="text-muted-foreground">{t.case.acquiredAt}:</span> {fmtDate(a!.acquiredAt, lang)}</div>
                    <div><span className="text-muted-foreground">{t.case.coveragePct}:</span> {a!.coveragePct ?? '—'}%</div>
                    <div><span className="text-muted-foreground">{t.case.qaStatus}:</span> {a!.qaStatus}</div>
                    <div><span className="text-muted-foreground">{t.case.grid}:</span> {a!.grid ?? '—'}</div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Fingerprint className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-[9px] text-muted-foreground break-all">{a!.sha256.slice(0, 24)}…</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground/70 mt-0.5 italic">{a!.licence}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Case lifecycle timeline (horizontal) + event log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2" lang={lang}>
                <History className="h-4 w-4 text-primary" />
                {lang === 'en' ? 'Case lifecycle' : 'কেস জীবনচক্র'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CaseTimeline c={c} lang={lang} />
            </CardContent>
          </Card>

          {/* Full revision history (append-only audit trail) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2" lang={lang}>
                <History className="h-4 w-4 text-primary" />
                {t.case.revisionHistory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {c.reviewHistory.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-3" lang={lang}>{t.case.noHistory}</div>
              ) : (
                <ol className="space-y-2 relative before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-border">
                  {c.reviewHistory.map((h) => (
                    <li key={h.id} className="relative pl-6">
                      <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      <div className="text-xs">
                        <span className="font-medium capitalize">{h.action.replace(/_/g, ' ')}</span>
                        {h.fromStatus && h.toStatus && (
                          <span className="text-muted-foreground">
                            {' '}• {h.fromStatus.replace(/_/g, ' ')} → {h.toStatus.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {h.actorName} • {fmtDate(h.createdAt, lang)}
                      </div>
                      {h.note && <div className="text-[11px] text-foreground/80 mt-0.5">{h.note}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: review form & assessment */}
        <div className="space-y-4">
          {c.assessment && (
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2" lang={lang}>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {t.case.reviewDecision}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div>
                  <span className="text-muted-foreground">{lang === 'en' ? 'Decision' : 'সিদ্ধান্ত'}:</span>{' '}
                  <span className="font-semibold capitalize">{c.assessment.decision.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.case.reviewedBy}:</span>{' '}
                  <span>{c.assessment.reviewerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.case.permitStatus}:</span>{' '}
                  <span className="capitalize">{c.assessment.permitStatus ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.case.nextAction}:</span>{' '}
                  <span>{c.assessment.nextAction ?? '—'}</span>
                </div>
                <Separator className="my-1" />
                <div className="text-foreground/90 leading-relaxed">{c.assessment.rationale}</div>
                <div className="text-[10px] text-muted-foreground">{fmtDate(c.assessment.createdAt, lang)}</div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base" lang={lang}>{t.case.reviewDecision}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!canReview ? (
                <div className="flex items-start gap-2 p-2.5 rounded bg-muted/50 text-xs text-muted-foreground" lang={lang}>
                  <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{t.case.submitWarning}</span>
                </div>
              ) : decisionOptions.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-3" lang={lang}>
                  {lang === 'en' ? 'No further action allowed from this status.' : 'এই অবস্থা থেকে আর কোনো পদক্ষেপ নেই।'}
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs" lang={lang}>{lang === 'en' ? 'Decision' : 'সিদ্ধান্ত'}</Label>
                    <Select value={decision} onValueChange={setDecision}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder={lang === 'en' ? 'Select…' : 'নির্বাচন…'} />
                      </SelectTrigger>
                      <SelectContent>
                        {decisionOptions.map((d) => (
                          <SelectItem key={d.value} value={d.value} className="text-xs">
                            {lang === 'en' ? d.labelEn : d.labelBn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs" lang={lang}>{t.case.permitStatus}</Label>
                    <Select value={permitStatus} onValueChange={setPermitStatus}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verified" className="text-xs">Verified</SelectItem>
                        <SelectItem value="unverified" className="text-xs">Unverified</SelectItem>
                        <SelectItem value="missing" className="text-xs">Missing</SelectItem>
                        <SelectItem value="not_applicable" className="text-xs">Not applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs" lang={lang}>{t.case.rationale}</Label>
                    <Textarea
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      rows={4}
                      placeholder={lang === 'en' ? 'Document the evidence basis and reasoning for this decision…' : 'এই সিদ্ধান্তের প্রমাণ ভিত্তি ও যৌক্তিকতা লিপিবদ্ধ করুন…'}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs" lang={lang}>{t.case.nextAction}</Label>
                    <Textarea
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                      rows={2}
                      placeholder={lang === 'en' ? 'E.g. forward to enforcement under ECA 6B…' : 'যেমন ECA 6B এর অধীনে এনফোর্সমেন্টে পাঠান…'}
                      className="text-xs"
                    />
                  </div>

                  <Button onClick={onSubmit} disabled={reviewMutation.isPending} className="w-full" size="sm">
                    {reviewMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    {t.case.submit}
                  </Button>
                  <div className="text-[10px] text-muted-foreground text-center" lang={lang}>
                    {lang === 'en' ? 'Revision' : 'রিভিশন'} {c.revision} • {lang === 'en' ? 'append-only history' : 'শুধু-যোগ ইতিহাস'}
                  </div>
                </>
              )}

              {canRequestReport && (
                <>
                  <Separator className="my-2" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => reportMutation.mutate()}
                    disabled={reportMutation.isPending}
                  >
                    {reportMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {t.case.requestReport}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Existing reports */}
          {c.reportVersions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base" lang={lang}>{t.report.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {c.reportVersions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border border-border rounded p-2 bg-card text-xs">
                    <div>
                      <div className="font-mono font-medium">{t.report.version} {r.version}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.status.replace(/_/g, ' ')} • {fmtDate(r.createdAt, lang)}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onDownloadReport(r.id)}>
                      {t.report.openPrintable}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'default' | 'warn' }) {
  return (
    <div className={`border rounded p-2 ${tone === 'warn' ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800' : 'border-border bg-muted/30'}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-sm font-semibold ${tone === 'warn' ? 'text-amber-700 dark:text-amber-300' : ''}`}>{value}</div>
    </div>
  )
}
