// Jobs list
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { mapJob } from '@/lib/dto-mappers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const jobs = await db.job.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json({ jobs: jobs.map(mapJob) })
}
