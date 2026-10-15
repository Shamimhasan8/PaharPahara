// PaharPahara — activity feed endpoint.
// Aggregates recent events from multiple sources into a single chronological feed:
//   - Audit logs (sign-in, case_reviewed, report_requested, etc.)
//   - Jobs (state changes)
//   - Notifications (for the current user)
//   - Cases (new detections)
//   - BMD bulletins (new alerts)
// Returns a unified, deduplicated, time-sorted list.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

interface FeedItem {
  id: string
  timestamp: string
  category: 'case' | 'job' | 'bmd' | 'source' | 'auth' | 'report' | 'system'
  action: string
  titleEn: string
  titleBn: string
  detailEn: string
  detailBn: string
  severity: 'info' | 'success' | 'warning' | 'error'
  actorName?: string | null
}

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30'), 100)

  // Fetch recent items from multiple sources in parallel
  const [auditLogs, jobs, notifications, recentCases, recentBulletins] = await Promise.all([
    db.auditLog.findMany({
      include: { actor: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.job.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 15,
    }),
    db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
    db.case.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 5,
      include: { site: { select: { nameEn: true, nameBn: true } } },
    }),
    db.bulletin.findMany({
      orderBy: { sentAt: 'desc' },
      take: 3,
    }),
  ])

  const items: FeedItem[] = []

  // Audit logs → feed items
  for (const a of auditLogs) {
    const actionLabelEn: Record<string, string> = {
      user_signin: 'Signed in',
      user_signout: 'Signed out',
      case_reviewed: 'Case reviewed',
      case_reviewed_bulk: 'Bulk case review',
      case_status_changed: 'Case status changed',
      case_opened: 'Case opened',
      report_requested: 'Report requested',
      seed_completed: 'Seed completed',
    }
    const actionLabelBn: Record<string, string> = {
      user_signin: 'সাইন ইন',
      user_signout: 'সাইন আউট',
      case_reviewed: 'কেস পর্যালোচিত',
      case_reviewed_bulk: 'বাল্ক কেস পর্যালোচনা',
      case_status_changed: 'কেস অবস্থা পরিবর্তিত',
      case_opened: 'কেস খোলা হয়েছে',
      report_requested: 'রিপোর্ট অনুরোধ',
      seed_completed: 'সীড সম্পন্ন',
    }
    const category: FeedItem['category'] = a.action.startsWith('user_') ? 'auth' : a.action.startsWith('case_') ? 'case' : a.action.startsWith('report_') ? 'report' : 'system'
    const severity: FeedItem['severity'] = a.action.includes('failed') || a.action.includes('error') ? 'error' : a.action.includes('signout') ? 'info' : a.action.includes('signin') ? 'info' : 'success'
    items.push({
      id: `audit-${a.id}`,
      timestamp: a.createdAt.toISOString(),
      category,
      action: a.action,
      titleEn: actionLabelEn[a.action] ?? a.action.replace(/_/g, ' '),
      titleBn: actionLabelBn[a.action] ?? a.action.replace(/_/g, ' '),
      detailEn: a.target ? `Target: ${a.target}` : '',
      detailBn: a.target ? `লক্ষ্য: ${a.target}` : '',
      severity,
      actorName: a.actor?.name ?? null,
    })
  }

  // Jobs → feed items (only show state changes for completed/failed)
  for (const j of jobs) {
    if (j.state === 'completed' || j.state === 'failed' || j.state === 'running') {
      const severity: FeedItem['severity'] = j.state === 'failed' ? 'error' : j.state === 'running' ? 'info' : 'success'
      const titleEn = j.state === 'failed' ? `Job failed: ${j.jobType}` : j.state === 'running' ? `Job running: ${j.jobType}` : `Job completed: ${j.jobType}`
      const titleBn = j.state === 'failed' ? `জব ব্যর্থ: ${j.jobType}` : j.state === 'running' ? `জব চলমান: ${j.jobType}` : `জব সম্পন্ন: ${j.jobType}`
      items.push({
        id: `job-${j.id}`,
        timestamp: j.updatedAt.toISOString(),
        category: 'job',
        action: `job_${j.state}`,
        titleEn,
        titleBn,
        detailEn: j.error ? `Error: ${j.error.slice(0, 100)}` : j.jobKey,
        detailBn: j.error ? `ত্রুটি: ${j.error.slice(0, 100)}` : j.jobKey,
        severity,
        actorName: j.leaseOwner ?? null,
      })
    }
  }

  // Recent cases (new detections)
  for (const c of recentCases) {
    items.push({
      id: `case-detected-${c.id}`,
      timestamp: c.detectedAt.toISOString(),
      category: 'case',
      action: 'case_detected',
      titleEn: `Case detected: ${c.caseKey}`,
      titleBn: `কেস সনাক্ত: ${c.caseKey}`,
      detailEn: `${c.site.nameEn} • ${c.changedAreaHa?.toFixed(2) ?? '—'} ha • ${c.status.replace(/_/g, ' ')}`,
      detailBn: `${c.site.nameBn} • ${c.changedAreaHa?.toFixed(2) ?? '—'} ha • ${c.status.replace(/_/g, ' ')}`,
      severity: c.status === 'rejected' ? 'info' : c.status === 'reviewed' ? 'success' : 'warning',
      actorName: 'CutWatch pipeline',
    })
  }

  // BMD bulletins
  for (const b of recentBulletins) {
    if (b.messageType === 'alert' || b.messageType === 'update') {
      items.push({
        id: `bmd-${b.id}`,
        timestamp: b.sentAt.toISOString(),
        category: 'bmd',
        action: `bmd_${b.messageType}`,
        titleEn: b.headlineEn,
        titleBn: b.headlineBn,
        detailEn: b.areaDesc,
        detailBn: b.areaDesc,
        severity: b.hasValidityConflict ? 'warning' : 'info',
        actorName: 'BMD',
      })
    }
  }

  // Deduplicate by (action + target/timestamp + category) — if the same event
  // appears in both audit logs and notifications, keep only the first occurrence.
  const seen = new Set<string>()
  const deduped = items.filter((item) => {
    // Create a dedup key from action + timestamp rounded to the second + category
    const ts = new Date(item.timestamp).getTime()
    const key = `${item.action}|${Math.floor(ts / 1000)}|${item.category}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort by timestamp desc, take limit
  deduped.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const limited = deduped.slice(0, limit)

  return NextResponse.json({ items: limited, total: deduped.length })
}
