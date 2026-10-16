// List all cases (with full DTO)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { mapCase } from '@/lib/dto-mappers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const cases = await db.case.findMany({
    include: {
      site: true,
      beforeAsset: { include: { source: true } },
      afterAsset: { include: { source: true } },
      assessments: { include: { reviewer: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      reviews: { include: { actor: true }, orderBy: { createdAt: 'asc' } },
      reportVersions: { orderBy: { version: 'desc' } },
    },
    orderBy: { detectedAt: 'desc' },
  })
  return NextResponse.json({ cases: cases.map(mapCase) })
}
