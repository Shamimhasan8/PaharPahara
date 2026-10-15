// PaharPahara — source health history endpoint.
// Returns synthesized access-state history per source adapter.
// For the prototype, we synthesize a 14-day history based on the current state.
// In production, this would be backed by a SourceHealthHistory table.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Map access state to a numeric health score (0-4) for sparkline rendering.
const STATE_SCORE: Record<string, number> = {
  live: 4,
  stale: 2,
  historical_replay: 3,
  unavailable: 0,
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sources = await db.sourceRegistry.findMany({ orderBy: { adapter: 'asc' } })

  // Synthesize 14-day history per source.
  // Real history would come from a SourceHealthHistory table; for the prototype
  // we generate a plausible trend ending at the current state.
  const now = Date.now()
  const days = 14
  const history = sources.map((s) => {
    const currentScore = STATE_SCORE[s.accessState] ?? 0
    // Generate a plausible backwards trend: small random walk ending at currentScore
    const points: Array<{ date: string; score: number; state: string }> = []
    let score = currentScore
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000)
      // Add some variation for past days (deterministic based on adapter + day)
      const seed = (s.adapter.charCodeAt(0) + i * 7) % 5
      const variation = i > 0 ? (seed - 2) * 0.5 : 0
      const adjScore = Math.max(0, Math.min(4, Math.round(score + variation)))
      const state =
        adjScore >= 4 ? 'live' : adjScore >= 3 ? 'historical_replay' : adjScore >= 2 ? 'stale' : 'unavailable'
      points.push({
        date: date.toISOString().slice(0, 10),
        score: adjScore,
        state,
      })
      score = adjScore
    }
    // Ensure the last point matches the current state exactly
    points[points.length - 1] = {
      date: points[points.length - 1].date,
      score: currentScore,
      state: s.accessState,
    }
    return {
      adapter: s.adapter,
      currentAccessState: s.accessState,
      lastCheckedAt: s.lastCheckedAt?.toISOString() ?? null,
      points,
    }
  })

  return NextResponse.json({ history })
}
