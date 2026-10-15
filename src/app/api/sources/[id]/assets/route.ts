// Get all raw assets for a single source adapter.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { mapRawAsset } from '@/lib/dto-mappers'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const source = await db.sourceRegistry.findUnique({ where: { id } })
  if (!source) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const assets = await db.rawAsset.findMany({
    where: { sourceId: id },
    include: { source: true },
    orderBy: { acquiredAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({
    source: {
      id: source.id,
      adapter: source.adapter,
      product: source.product,
      accessState: source.accessState,
    },
    assets: assets.map((a) => mapRawAsset(a, a.source)),
  })
}
