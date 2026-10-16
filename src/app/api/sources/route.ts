// Sources list
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { mapSource } from '@/lib/dto-mappers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const sources = await db.sourceRegistry.findMany({ orderBy: { adapter: 'asc' } })
  return NextResponse.json({ sources: sources.map(mapSource) })
}
