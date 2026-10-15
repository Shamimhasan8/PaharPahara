// PaharPahara — bulk case review endpoint.
// Allows an authorized reviewer to apply the same decision to multiple cases at once.
// Each case is validated individually (revision + transition); failures don't abort the batch.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { can } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const DECISION_TO_STATUS: Record<string, string> = {
  approved: 'reviewed',
  rejected: 'rejected',
  field_verification_requested: 'field_verification',
  needs_more_evidence: 'under_review',
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!can(session.role, 'review_case')) {
    return NextResponse.json({ error: 'forbidden: role cannot review cases' }, { status: 403 })
  }

  const body = await req.json()
  const { caseIds, decision, rationale, permitStatus, nextAction } = body as {
    caseIds: string[]
    decision: string
    rationale: string
    permitStatus?: string
    nextAction?: string
  }

  if (!Array.isArray(caseIds) || caseIds.length === 0) {
    return NextResponse.json({ error: 'caseIds must be a non-empty array' }, { status: 400 })
  }
  if (caseIds.length > 20) {
    return NextResponse.json({ error: 'max 20 cases per bulk operation' }, { status: 400 })
  }
  if (!decision || !rationale) {
    return NextResponse.json({ error: 'decision and rationale required' }, { status: 400 })
  }

  const newStatus = DECISION_TO_STATUS[decision]
  if (!newStatus) {
    return NextResponse.json({ error: 'invalid decision' }, { status: 400 })
  }

  const results: Array<{ caseId: string; caseKey: string; ok: boolean; error?: string; newStatus?: string; newRevision?: number }> = []

  for (const caseId of caseIds) {
    try {
      const c = await db.case.findUnique({ where: { id: caseId } })
      if (!c) {
        results.push({ caseId, caseKey: '?', ok: false, error: 'case not found' })
        continue
      }

      // Validate transition is allowed from current status
      const allowedTransitions: Record<string, string[]> = {
        candidate: ['under_review', 'rejected'],
        under_review: ['field_verification', 'reviewed', 'rejected', 'candidate'],
        field_verification: ['field_corroborated', 'under_review', 'rejected'],
        field_corroborated: ['reviewed', 'rejected'],
        reviewed: [],
        rejected: ['candidate'],
      }
      const allowed = allowedTransitions[c.status] ?? []
      if (!allowed.includes(newStatus)) {
        results.push({ caseId, caseKey: c.caseKey, ok: false, error: `cannot transition from ${c.status} to ${newStatus}` })
        continue
      }

      // Atomic update: bump revision + change status, create assessment + review history
      const updated = await db.$transaction(async (tx) => {
        const updatedCase = await tx.case.update({
          where: { id: caseId },
          data: { status: newStatus, revision: c.revision + 1 },
        })
        const assessment = await tx.assessment.create({
          data: {
            caseId,
            reviewerId: session.userId,
            decision,
            rationale: `[BULK] ${rationale}`,
            permitStatus: permitStatus ?? null,
            nextAction: nextAction ?? null,
            caseRevision: c.revision,
          },
        })
        await tx.reviewHistory.create({
          data: {
            caseId,
            assessmentId: assessment.id,
            actorId: session.userId,
            action: 'reviewed',
            fromStatus: c.status,
            toStatus: newStatus,
            note: `Bulk action: ${rationale.slice(0, 200)}`,
          },
        })
        await tx.auditLog.create({
          data: {
            actorId: session.userId,
            action: 'case_reviewed_bulk',
            target: caseId,
            detailJson: JSON.stringify({ decision, from: c.status, to: newStatus, caseKey: c.caseKey, bulkCount: caseIds.length }),
          },
        })
        return updatedCase
      })

      results.push({ caseId, caseKey: c.caseKey, ok: true, newStatus: updated.status, newRevision: updated.revision })
    } catch (e) {
      results.push({ caseId, caseKey: '?', ok: false, error: (e as Error).message })
    }
  }

  const succeeded = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length

  return NextResponse.json({
    ok: failed === 0,
    succeeded,
    failed,
    results,
  })
}
