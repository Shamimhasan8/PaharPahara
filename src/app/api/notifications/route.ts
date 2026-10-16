// Notifications list for current user
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { mapNotification } from '@/lib/dto-mappers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ notifications: notifications.map(mapNotification) })
}

// Mark all as read
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  await db.notification.updateMany({
    where: { userId: session.userId, read: false },
    data: { read: true },
  })
  return NextResponse.json({ ok: true })
}
