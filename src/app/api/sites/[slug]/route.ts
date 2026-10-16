// Get site detail with raw assets
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { mapSite, mapRawAsset } from '@/lib/dto-mappers'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { slug } = await params
  const site = await db.site.findUnique({ where: { slug } })
  if (!site) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const assets = await db.rawAsset.findMany({
    where: { siteId: site.id },
    include: { source: true },
    orderBy: { acquiredAt: 'asc' },
  })

  return NextResponse.json({
    site: mapSite(site),
    assets: assets.map((a) => mapRawAsset(a, a.source)),
  })
}
