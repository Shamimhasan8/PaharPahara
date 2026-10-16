// BMD bulletins
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { mapBulletin } from '@/lib/dto-mappers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const bulletins = await db.bulletin.findMany({ orderBy: { sentAt: 'desc' }, take: 50 })
  return NextResponse.json({ bulletins: bulletins.map(mapBulletin) })
}
