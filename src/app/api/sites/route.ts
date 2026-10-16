// List all sites
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { mapSite } from '@/lib/dto-mappers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const sites = await db.site.findMany({ orderBy: { nameEn: 'asc' } })
  return NextResponse.json({ sites: sites.map(mapSite) })
}
