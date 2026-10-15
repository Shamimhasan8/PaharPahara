// Mark a single notification as read
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  await db.notification.updateMany({
    where: { id, userId: session.userId },
    data: { read: true },
  })
  return NextResponse.json({ ok: true })
}
