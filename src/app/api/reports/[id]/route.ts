// Get a single report version's frozen fact snapshot and render a printable HTML report.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

function fmt(date: string | null | undefined, lang: 'en' | 'bn') {
  if (!date) return lang === 'bn' ? '—' : '—'
  const d = new Date(date)
  return d.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dhaka',
    timeZoneName: 'short',
  })
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const report = await db.reportVersion.findUnique({
    where: { id },
    include: { case: { include: { site: true } } },
  })
  if (!report) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const url = new URL(req.url)
  const format = url.searchParams.get('format') ?? 'json'
  const lang: 'en' | 'bn' = url.searchParams.get('lang') === 'bn' ? 'bn' : 'en'

  if (format === 'json') {
    return NextResponse.json({ report })
  }

  // Render printable HTML
  const snap = JSON.parse(report.factSnapshotJson) as Record<string, unknown>
  const html = renderReportHtml(snap, report, lang)
  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function renderReportHtml(snap: Record<string, unknown>, report: { id: string; version: number; status: string; pdfSha256: string | null; createdAt: Date; case: { caseKey: string } }, lang: 'en' | 'bn') {
  const bn = lang === 'bn'
  const caseKey = String(snap.caseKey ?? report.case.caseKey)
  const siteName = bn ? String(snap.siteNameBn ?? snap.siteNameEn ?? '') : String(snap.siteNameEn ?? snap.siteNameBn ?? '')
  const district = String(snap.siteDistrict ?? '')
  const status = String(snap.status ?? '')
  const dt = String(snap.detectedAt ?? '')
  const changedArea = snap.changedAreaHa != null ? Number(snap.changedAreaHa).toFixed(2) : '—'
  const ndvi = snap.ndviDelta != null ? Number(snap.ndviDelta).toFixed(2) : '—'
  const bare = snap.bareSoilDelta != null ? Number(snap.bareSoilDelta).toFixed(2) : '—'
  const coverage = snap.coveragePct != null ? Number(snap.coveragePct).toFixed(0) + '%' : '—'
  const method = String(snap.methodVersion ?? '')
  const uncertainty = String(snap.uncertaintyNotes ?? '')
  const assessment = (snap.assessment ?? null) as { decision: string; rationale: string; permitStatus: string | null; nextAction: string | null; reviewerName: string; createdAt: string } | null

  return `<!doctype html>
<html lang="${bn ? 'bn' : 'en'}">
<head>
<meta charset="utf-8">
<title>${caseKey} — v${report.version}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/report-print.css">
</head>
<body lang="${bn ? 'bn' : 'en'}">
  <div class="noprint">
    <button onclick="window.print()">${bn ? 'প্রিন্ট / PDF' : 'Print / Save as PDF'}</button>
  </div>
  <h1>${bn ? 'পাহাড় বিঘ্ন ও আবহাওয়া মূল্যায়ন' : 'Hill Disturbance & Weather Assessment'}</h1>
  <div class="meta">
    ${caseKey} • ${bn ? 'সংস্করণ' : 'Version'} ${report.version} •
    <span class="badge ${report.status === 'reviewed' ? 'reviewed' : report.status === 'field_corroborated' ? 'field' : 'draft'}">${report.status.replace(/_/g, ' ')}</span>
    • ${fmt(report.createdAt.toISOString(), lang)}
  </div>

  <h2>${bn ? 'সাইট ও এখতিয়ার' : 'Site & Jurisdiction'}</h2>
  <table>
    <tr><th>${bn ? 'সাইট' : 'Site'}</th><td>${siteName}</td></tr>
    <tr><th>${bn ? 'জেলা' : 'District'}</th><td>${district}</td></tr>
    <tr><th>${bn ? 'এখতিয়ার' : 'Jurisdiction'}</th><td>${String(snap.jurisdiction ?? '').replace(/_/g, ' ')}</td></tr>
    <tr><th>${bn ? 'অবস্থা' : 'Status'}</th><td>${status.replace(/_/g, ' ')}</td></tr>
    <tr><th>${bn ? 'সনাক্তকরণ সময়' : 'Detected at'}</th><td>${fmt(dt, lang)} (Asia/Dhaka)</td></tr>
  </table>

  <h2>${bn ? 'প্রমাণ — স্যাটেলাইট জোড়া' : 'Evidence — Satellite Pair'}</h2>
  <table>
    <tr><th>${bn ? 'পূর্ব-অ্যাসেট' : 'Before asset'}</th><td>${(snap.before as { providerAssetId?: string } | null)?.providerAssetId ?? '—'}<br><span style="color:#888;font-size:11px;">${fmt((snap.before as { acquiredAt?: string } | null)?.acquiredAt, lang)} • coverage ${(snap.before as { coveragePct?: number } | null)?.coveragePct ?? '—'}%</span></td></tr>
    <tr><th>${bn ? 'পরবর্তী-অ্যাসেট' : 'After asset'}</th><td>${(snap.after as { providerAssetId?: string } | null)?.providerAssetId ?? '—'}<br><span style="color:#888;font-size:11px;">${fmt((snap.after as { acquiredAt?: string } | null)?.acquiredAt, lang)} • coverage ${(snap.after as { coveragePct?: number } | null)?.coveragePct ?? '—'}%</span></td></tr>
    <tr><th>${bn ? 'পরিবর্তিত এলাকা' : 'Changed area'}</th><td>${changedArea} ha</td></tr>
    <tr><th>${bn ? 'NDVI পরিবর্তন' : 'NDVI Δ'}</th><td>${ndvi}</td></tr>
    <tr><th>${bn ? 'খালি মাটি সূচক পরিবর্তন' : 'Bare-soil Δ'}</th><td>${bare}</td></tr>
    <tr><th>${bn ? 'সাধারণ কভারেজ' : 'Common coverage'}</th><td>${coverage}</td></tr>
    <tr><th>${bn ? 'পদ্ধতি' : 'Method'}</th><td>${method}</td></tr>
  </table>

  <h2>${bn ? 'অনিশ্চয়তা ও সীমাবদ্ধতা' : 'Uncertainty & Limitations'}</h2>
  <p style="font-size:13px;">${uncertainty}</p>

  ${assessment ? `
  <h2>${bn ? 'পর্যালোচক সিদ্ধান্ত' : 'Reviewer Decision'}</h2>
  <table>
    <tr><th>${bn ? 'সিদ্ধান্ত' : 'Decision'}</th><td><strong>${assessment.decision.replace(/_/g, ' ')}</strong></td></tr>
    <tr><th>${bn ? 'পর্যালোচক' : 'Reviewer'}</th><td>${assessment.reviewerName}</td></tr>
    <tr><th>${bn ? 'অনুমতি অবস্থা' : 'Permit status'}</th><td>${assessment.permitStatus ?? '—'}</td></tr>
    <tr><th>${bn ? 'যৌক্তিকতা' : 'Rationale'}</th><td>${assessment.rationale}</td></tr>
    <tr><th>${bn ? 'পরবর্তী পদক্ষেপ' : 'Next action'}</th><td>${assessment.nextAction ?? '—'}</td></tr>
  </table>` : ''}

  <h2>${bn ? 'অখণ্ডতা' : 'Integrity'}</h2>
  <table>
    <tr><th>${bn ? 'ফ্যাক্ট স্ন্যাপশট হ্যাশ' : 'Fact snapshot hash (SHA-256)'}</th><td><div class="hash">${report.pdfSha256 ?? '—'}</div></td></tr>
    <tr><th>${bn ? 'কেস রিভিশন' : 'Case revision (pinned)'}</th><td>${String(snap.caseRevision ?? '—')}</td></tr>
    <tr><th>${bn ? 'অনুরোধকারী' : 'Requested by'}</th><td>${String(snap.requestedBy ?? '—')}</td></tr>
  </table>

  <div class="footer">
    ${bn ? 'এই রিপোর্টটি একটি সিদ্ধান্ত-সহায়ক নথি। এটি আইনি সংজ্ঞা বা আদালতে গ্রহণযোগ্যতার প্রমাণ নয়। বাংলাদেশ পরিবেশ সংরক্ষণ আইন ৬বি এর অধীনে এনফোর্সমেন্ট কর্তৃপক্ষের কাছে অনুমতি/ক্লিয়ারেন্স যাচাই পৃথক।' : 'This report is a decision-support document. It is not a legal conclusion or proof of courtroom admissibility. Permit/clearance verification under Bangladesh Environment Conservation Act 6B remains with the authorized enforcement authority.'}
  </div>
</body>
</html>`
}
