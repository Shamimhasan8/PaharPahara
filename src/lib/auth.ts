// PaharPahara — auth helpers
// Validates user credentials against SQLite via Prisma.
// Passwords in seed use demo$<sha256_prefix> format (prototype only).

import { db } from '@/lib/db'
import { createHash } from 'crypto'

function demoHash(pw: string): string {
  return `demo$${createHash('sha256').update(pw).digest('hex').slice(0, 32)}`
}

export interface PaharUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'doe_reviewer' | 'forest_officer' | 'preparedness' | 'viewer'
  agency: string | null
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PaharUser | null> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return null
  // Accept both bcrypt hashes (future) and demo$ hashes (seed)
  let ok = false
  if (user.password.startsWith('demo$')) {
    ok = user.password === demoHash(password)
  } else {
    // bcrypt fallback
    try {
      const bcrypt = await import('bcryptjs')
      ok = await bcrypt.compare(password, user.password)
    } catch {
      ok = false
    }
  }
  if (!ok) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as PaharUser['role'],
    agency: user.agency,
  }
}

// Role permission matrix
export type Capability =
  | 'view_dashboard'
  | 'view_site'
  | 'view_case'
  | 'review_case'
  | 'request_field_verification'
  | 'corroborate_field'
  | 'request_report'
  | 'view_report'
  | 'dispatch_jobs'
  | 'manage_users'
  | 'view_preparedness'

const CAPABILITIES: Record<PaharUser['role'], Capability[]> = {
  admin: [
    'view_dashboard',
    'view_site',
    'view_case',
    'review_case',
    'request_field_verification',
    'corroborate_field',
    'request_report',
    'view_report',
    'dispatch_jobs',
    'manage_users',
    'view_preparedness',
  ],
  doe_reviewer: [
    'view_dashboard',
    'view_site',
    'view_case',
    'review_case',
    'request_field_verification',
    'request_report',
    'view_report',
  ],
  forest_officer: [
    'view_dashboard',
    'view_site',
    'view_case',
    'corroborate_field',
    'view_report',
  ],
  preparedness: ['view_dashboard', 'view_site', 'view_preparedness', 'view_report'],
  viewer: ['view_dashboard', 'view_site', 'view_report'],
}

export function can(role: PaharUser['role'], cap: Capability): boolean {
  return CAPABILITIES[role]?.includes(cap) ?? false
}
