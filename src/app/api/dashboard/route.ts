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

  const [sites, sources, bulletins, jobs, notifications, cases, weather, riskZones] = await Promise.all([
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
    db.riskZone.findMany({ include: { site: { select: { nameEn: true, nameBn: true, slug: true } } }, orderBy: [{ level: 'asc' }] }),
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

  // Compute risk zone summary
  const redZones = riskZones.filter((z) => z.level === 'red')
  const yellowZones = riskZones.filter((z) => z.level === 'yellow')
  const greenZones = riskZones.filter((z) => z.level === 'green')

  const payload: DashboardDataDTO & { riskZones?: unknown; riskSummary?: unknown } = {
    sites: sites.map(mapSite),
    cases: cases.map(mapCase),
    bulletins: bulletins.map(mapBulletin),
    sources: sources.map(mapSource),
    jobs: jobs.map(mapJob),
    notifications: notifications.map(mapNotification),
    rainfallSummary,
    riskZones: riskZones.map((z) => ({
      id: z.id,
      siteId: z.siteId,
      siteNameEn: z.site?.nameEn ?? null,
      siteNameBn: z.site?.nameBn ?? null,
      siteSlug: z.site?.slug ?? null,
      nameEn: z.nameEn,
      nameBn: z.nameBn,
      geometryJson: z.geometryJson,
      level: z.level,
      areaHectares: z.areaHectares,
      reasonEn: z.reasonEn,
      reasonBn: z.reasonBn,
      factorsJson: z.factorsJson,
      populationEstimate: z.populationEstimate,
      source: z.source,
    })),
    riskSummary: {
      red: { count: redZones.length, areaHectares: redZones.reduce((s, z) => s + z.areaHectares, 0), population: redZones.reduce((s, z) => s + (z.populationEstimate ?? 0), 0) },
      yellow: { count: yellowZones.length, areaHectares: yellowZones.reduce((s, z) => s + z.areaHectares, 0), population: yellowZones.reduce((s, z) => s + (z.populationEstimate ?? 0), 0) },
      green: { count: greenZones.length, areaHectares: greenZones.reduce((s, z) => s + z.areaHectares, 0), population: greenZones.reduce((s, z) => s + (z.populationEstimate ?? 0), 0) },
    },
  }

  return NextResponse.json(payload)
}
