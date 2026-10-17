// PaharPahara — Risk Zones API
// Returns all Red/Yellow/Green risk zones for map visualization.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const zones = await db.riskZone.findMany({
    include: { site: { select: { nameEn: true, nameBn: true, slug: true } } },
    orderBy: [{ level: 'asc' }, { areaHectares: 'desc' }],
  })

  // Compute summary
  const red = zones.filter((z) => z.level === 'red')
  const yellow = zones.filter((z) => z.level === 'yellow')
  const green = zones.filter((z) => z.level === 'green')
  const redArea = red.reduce((s, z) => s + z.areaHectares, 0)
  const yellowArea = yellow.reduce((s, z) => s + z.areaHectares, 0)
  const greenArea = green.reduce((s, z) => s + z.areaHectares, 0)
  const totalPop = zones.reduce((s, z) => s + (z.populationEstimate ?? 0), 0)

  return NextResponse.json({
    zones: zones.map((z) => ({
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
    summary: {
      red: { count: red.length, areaHectares: redArea, population: red.reduce((s, z) => s + (z.populationEstimate ?? 0), 0) },
      yellow: { count: yellow.length, areaHectares: yellowArea, population: yellow.reduce((s, z) => s + (z.populationEstimate ?? 0), 0) },
      green: { count: green.length, areaHectares: greenArea, population: green.reduce((s, z) => s + (z.populationEstimate ?? 0), 0) },
      total: { count: zones.length, areaHectares: redArea + yellowArea + greenArea, population: totalPop },
    },
  })
}
