// PaharPahara — main dashboard endpoint
// Returns all data needed to render the dashboard in one round-trip.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import {
  mapSite,
  mapCase,
  mapBulletin,
  mapSource,
  mapJob,
  mapNotification,
  computeRainfallTotals,
} from '@/lib/dto-mappers'
import type { DashboardDataDTO } from '@/lib/types/dto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [sites, sources, bulletins, jobs, notifications, cases, weather] = await Promise.all([
    db.site.findMany({ orderBy: { nameEn: 'asc' } }),
    db.sourceRegistry.findMany({ orderBy: { adapter: 'asc' } }),
    db.bulletin.findMany({ orderBy: { sentAt: 'desc' }, take: 20 }),
    db.job.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
    db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.case.findMany({
      include: {
        site: true,
        beforeAsset: { include: { source: true } },
        afterAsset: { include: { source: true } },
        assessments: { include: { reviewer: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        reviews: { include: { actor: true }, orderBy: { createdAt: 'asc' } },
        reportVersions: { orderBy: { version: 'desc' } },
      },
      orderBy: { detectedAt: 'desc' },
    }),
    db.weatherInterval.findMany(),
  ])

  const rainfallSummary: DashboardDataDTO['rainfallSummary'] = {}
  for (const site of sites) {
    const siteWeather = weather.filter((w) => w.siteId === site.id)
    const t24 = computeRainfallTotals(siteWeather, 24)
    const t72 = computeRainfallTotals(siteWeather, 72)
    rainfallSummary[site.id] = {
      total24h: t24.totalMm,
      total72h: t72.totalMm,
      complete: t24.complete,
      asOf: t24.asOf?.toISOString() ?? null,
    }
  }

  const payload: DashboardDataDTO = {
    sites: sites.map(mapSite),
    cases: cases.map(mapCase),
    bulletins: bulletins.map(mapBulletin),
    sources: sources.map(mapSource),
    jobs: jobs.map(mapJob),
    notifications: notifications.map(mapNotification),
    rainfallSummary,
  }

  return NextResponse.json(payload)
}
