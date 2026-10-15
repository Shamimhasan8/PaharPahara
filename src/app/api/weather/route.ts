// Per-site weather intervals
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { mapWeather, computeRainfallTotals } from '@/lib/dto-mappers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const siteId = url.searchParams.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const intervals = await db.weatherInterval.findMany({
    where: { siteId },
    orderBy: { intervalStart: 'asc' },
  })

  const t24 = computeRainfallTotals(intervals, 24)
  const t48 = computeRainfallTotals(intervals, 48)
  const t72 = computeRainfallTotals(intervals, 72)
  const t120 = computeRainfallTotals(intervals, 120)

  return NextResponse.json({
    intervals: intervals.map(mapWeather),
    totals: {
      '24h': { totalMm: t24.totalMm, complete: t24.complete, asOf: t24.asOf?.toISOString() ?? null, expected: t24.expectedCount, actual: t24.actualCount },
      '48h': { totalMm: t48.totalMm, complete: t48.complete, asOf: t48.asOf?.toISOString() ?? null, expected: t48.expectedCount, actual: t48.actualCount },
      '72h': { totalMm: t72.totalMm, complete: t72.complete, asOf: t72.asOf?.toISOString() ?? null, expected: t72.expectedCount, actual: t72.actualCount },
      '120h': { totalMm: t120.totalMm, complete: t120.complete, asOf: t120.asOf?.toISOString() ?? null, expected: t120.expectedCount, actual: t120.actualCount },
    },
  })
}
