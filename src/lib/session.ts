// PaharPahara — server-side session helper
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'
import type { Role } from '@/lib/types/dto'

export interface ServerSession {
  userId: string
  email: string
  name: string
  role: Role
  agency: string | null
}

export async function getSession(): Promise<ServerSession | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
    agency: session.user.agency ?? null,
  }
}

// Look up the current user's notification list (only their own).
export async function getMyNotifications(userId: string, limit = 50) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
