// PaharPahara — notification settings endpoint.
// Stores per-user category preferences in a JSON column on User.
// For prototype simplicity, we store settings as a JSON string in a new column.
// Since we can't easily alter the schema mid-flight, we store preferences in localStorage
// on the client and also expose this endpoint for future server-side persistence.

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // For now, return default settings (client-side localStorage overrides)
  return NextResponse.json({
    settings: {
      case: true,
      bmd: true,
      source: true,
      job: true,
      report: true,
    },
  })
}
