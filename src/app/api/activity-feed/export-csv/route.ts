// PaharPahara — activity feed CSV export endpoint.
// Returns the activity feed as a downloadable CSV file for compliance/audit purposes.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Reuse the same aggregation logic as /api/activity-feed
  const [auditLogs, jobs, notifications, recentCases, recentBulletins] = await Promise.all([
    db.auditLog.findMany({
      include: { actor: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.job.findMany({ orderBy: { updatedAt: 'desc' }, take: 30 }),
    db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    db.case.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 10,
      include: { site: { select: { nameEn: true, nameBn: true } } },
    }),
    db.bulletin.findMany({ orderBy: { sentAt: 'desc' }, take: 5 }),
  ])

  const rows: Array<Record<string, string>> = []

  for (const a of auditLogs) {
    rows.push({
      timestamp: a.createdAt.toISOString(),
      category: a.action.startsWith('user_') ? 'auth' : a.action.startsWith('case_') ? 'case' : a.action.startsWith('report_') ? 'report' : 'system',
      action: a.action,
      title: a.action.replace(/_/g, ' '),
      detail: a.target ?? '',
      severity: a.action.includes('failed') ? 'error' : 'info',
      actor: a.actor?.name ?? '',
    })
  }

  for (const j of jobs) {
    if (j.state === 'completed' || j.state === 'failed' || j.state === 'running') {
      rows.push({
        timestamp: j.updatedAt.toISOString(),
        category: 'job',
        action: `job_${j.state}`,
        title: `Job ${j.state}: ${j.jobType}`,
        detail: j.error ? `Error: ${j.error}` : j.jobKey,
        severity: j.state === 'failed' ? 'error' : j.state === 'running' ? 'info' : 'success',
        actor: j.leaseOwner ?? '',
      })
    }
  }

  for (const c of recentCases) {
    rows.push({
      timestamp: c.detectedAt.toISOString(),
      category: 'case',
      action: 'case_detected',
      title: `Case detected: ${c.caseKey}`,
      detail: `${c.site.nameEn} • ${c.changedAreaHa?.toFixed(2) ?? '—'} ha • ${c.status.replace(/_/g, ' ')}`,
      severity: c.status === 'rejected' ? 'info' : c.status === 'reviewed' ? 'success' : 'warning',
      actor: 'CutWatch pipeline',
    })
  }

  for (const b of recentBulletins) {
    if (b.messageType === 'alert' || b.messageType === 'update') {
      rows.push({
        timestamp: b.sentAt.toISOString(),
        category: 'bmd',
        action: `bmd_${b.messageType}`,
        title: b.headlineEn,
        detail: b.areaDesc,
        severity: b.hasValidityConflict ? 'warning' : 'info',
        actor: 'BMD',
      })
    }
  }

  rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  // Build CSV
  const headers = ['Timestamp', 'Category', 'Action', 'Title', 'Detail', 'Severity', 'Actor']
  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      [r.timestamp, r.category, r.action, `"${r.title.replace(/"/g, '""')}"`, `"${r.detail.replace(/"/g, '""')}"`, r.severity, `"${r.actor.replace(/"/g, '""')}"`].join(','),
    ),
  ]
  const csv = csvLines.join('\n')

  const filename = `paharpahara-activity-feed-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  })
}
