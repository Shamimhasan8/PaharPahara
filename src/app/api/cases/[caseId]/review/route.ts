// Record a reviewer decision on a case.
// Validates JWT, role, expected case revision, and requested transition.
// Writes append-only review history and bumps case revision.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { can } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const TRANSITIONS: Record<string, string[]> = {
  candidate: ['under_review', 'rejected'],
  under_review: ['field_verification', 'reviewed', 'rejected', 'candidate'],
  field_verification: ['field_corroborated', 'under_review', 'rejected'],
  field_corroborated: ['reviewed', 'rejected'],
  reviewed: [],
  rejected: ['candidate'],
}

const DECISION_TO_STATUS: Record<string, string> = {
  approved: 'reviewed',
  rejected: 'rejected',
  field_verification_requested: 'field_verification',
  field_corroborated: 'field_corroborated',
  needs_more_evidence: 'under_review',
}

export async function POST(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { caseId } = await params
  const body = await req.json()
  const { decision, rationale, permitStatus, nextAction, expectedRevision } = body as {
    decision: string
    rationale: string
    permitStatus?: string
    nextAction?: string
    expectedRevision: number
  }

  if (!decision || !rationale || !expectedRevision) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  // Capability check
  const allowed = can(session.role, 'review_case')
  if (!allowed) {
    return NextResponse.json({ error: 'forbidden: role cannot review cases' }, { status: 403 })
  }

  // Fetch case
  const c = await db.case.findUnique({ where: { id: caseId } })
  if (!c) return NextResponse.json({ error: 'case not found' }, { status: 404 })

  // Optimistic concurrency: expected revision must match
  if (c.revision !== expectedRevision) {
    return NextResponse.json(
      {
        error: 'stale_revision',
        message: `Case revision has changed. Expected ${expectedRevision} but current is ${c.revision}. Please reload and try again.`,
        currentRevision: c.revision,
      },
      { status: 409 },
    )
  }

  const newStatus = DECISION_TO_STATUS[decision]
  if (!newStatus) {
    return NextResponse.json({ error: 'invalid decision' }, { status: 400 })
  }

  // Validate transition
  const allowedNext = TRANSITIONS[c.status] ?? []
  if (!allowedNext.includes(newStatus)) {
    return NextResponse.json(
      { error: 'invalid_transition', message: `Cannot transition from ${c.status} to ${newStatus}` },
      { status: 400 },
    )
  }

  // Atomic update: bump revision + change status, then create assessment + review history entry
  const updated = await db.$transaction(async (tx) => {
    const updatedCase = await tx.case.update({
      where: { id: caseId },
      data: {
        status: newStatus,
        revision: c.revision + 1,
      },
    })

    const assessment = await tx.assessment.create({
      data: {
        caseId,
        reviewerId: session.userId,
        decision,
        rationale,
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
        note: rationale.slice(0, 280),
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: session.userId,
        action: 'case_reviewed',
        target: caseId,
        detailJson: JSON.stringify({ decision, from: c.status, to: newStatus, caseKey: c.caseKey }),
        ipAddress: null,
      },
    })

    return updatedCase
  })

  return NextResponse.json({ ok: true, newStatus: updated.status, newRevision: updated.revision })
}
