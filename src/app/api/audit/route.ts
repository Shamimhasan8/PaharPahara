// PaharPahara — audit log endpoint (admin only).
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden: admin only' }, { status: 403 })
  }

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 500)

  const logs = await db.auditLog.findMany({
    include: { actor: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      actorId: l.actorId,
      actorName: l.actor?.name ?? null,
      actorEmail: l.actor?.email ?? null,
      actorRole: l.actor?.role ?? null,
      action: l.action,
      target: l.target,
      detailJson: l.detailJson,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    })),
  })
}
