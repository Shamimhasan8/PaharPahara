'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ExternalLink, Fingerprint, Hash, History } from 'lucide-react'
import type { DashboardDataDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'
import { fmtDate } from '@/components/pahar/badges'

interface Props {
  data: DashboardDataDTO
  lang: Lang
}

export function ReportsView({ data, lang }: Props) {
  const t = dict[lang]
  // Flatten report versions across cases
  const reports = data.cases
    .flatMap((c) => c.reportVersions.map((r) => ({ ...r, caseKey: c.caseKey, siteNameEn: c.siteNameEn, siteNameBn: c.siteNameBn, status: c.status })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" lang={lang}>{t.report.title}</h1>
        <p className="text-sm text-muted-foreground mt-1" lang={lang}>{t.report.list}</p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground" lang={lang}>{t.report.noReports}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {reports.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-mono truncate">{r.caseKey}</CardTitle>
                      <div className="text-[10px] text-muted-foreground">{t.report.version} {r.version}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {r.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="text-muted-foreground" lang={lang}>
                  {lang === 'en' ? r.siteNameEn : r.siteNameBn}
                </div>
                <div className="text-muted-foreground">{t.report.requestedAt}: {fmtDate(r.createdAt, lang)}</div>
                <div className="flex items-start gap-1.5 pt-1">
                  <Fingerprint className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="font-mono text-[10px] text-muted-foreground break-all">{r.pdfSha256?.slice(0, 32) ?? '—'}…</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => window.open(`/api/reports/${r.id}?format=html&lang=${lang}`, '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  {t.report.openPrintable}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" lang={lang}>
            <History className="h-4 w-4 text-primary" />
            {lang === 'en' ? 'About report integrity' : 'রিপোর্ট অখণ্ডতা সম্পর্কে'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1.5" lang={lang}>
          <p>
            {lang === 'en'
              ? 'Each report version freezes a fact snapshot at request time. Refreshing data cannot alter an old report. The SHA-256 hash detects changed bytes; it does not prove a source claim is true.'
              : 'প্রতিটি রিপোর্ট সংস্করণ অনুরোধের সময় একটি ফ্যাক্ট স্ন্যাপশট ফ্রিজ করে। ডেটা রিফ্রেশ করলে পুরোনো রিপোর্ট পরিবর্তিত হয় না। SHA-256 হ্যাশ পরিবর্তিত বাইট সনাক্ত করে; এটি উৎস দাবি সত্য প্রমাণ করে না।'}
          </p>
          <p>
            {lang === 'en'
              ? 'Reports are decision-support documents. They are not legal conclusions or courtroom-admissible proof. Permit/clearance verification under ECA 6B remains with the authorized enforcement authority.'
              : 'রিপোর্ট সিদ্ধান্ত-সহায়ক নথি। এগুলো আইনি সিদ্ধান্ত বা আদালতে গ্রহণযোগ্য প্রমাণ নয়। ECA 6B এর অধীনে অনুমতি/ক্লিয়ারেন্স যাচাই অনুমোদিত এনফোর্সমেন্ট কর্তৃপক্ষের কাছে থাকে।'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
