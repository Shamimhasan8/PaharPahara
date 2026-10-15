// Request a new report version for a case.
// Queues a render_pdf job, freezes the fact snapshot, returns the new version.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { can } from '@/lib/auth'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!can(session.role, 'request_report')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { caseId } = await params
  const c = await db.case.findUnique({
    where: { id: caseId },
    include: {
      site: true,
      beforeAsset: { include: { source: true } },
      afterAsset: { include: { source: true } },
      assessments: { include: { reviewer: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      reportVersions: { orderBy: { version: 'desc' } },
    },
  })
  if (!c) return NextResponse.json({ error: 'case not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const lang: 'en' | 'bn' = body?.lang === 'bn' ? 'bn' : 'en'

  // Frozen fact snapshot
  const snapshot = {
    caseKey: c.caseKey,
    siteNameEn: c.site.nameEn,
    siteNameBn: c.site.nameBn,
    siteDistrict: c.site.district,
    jurisdiction: c.site.jurisdiction,
    status: c.status,
    disturbanceType: c.disturbanceType,
    detectedAt: c.detectedAt.toISOString(),
    before: c.beforeAsset
      ? {
          providerAssetId: c.beforeAsset.providerAssetId,
          acquiredAt: c.beforeAsset.acquiredAt.toISOString(),
          coveragePct: c.beforeAsset.coveragePct,
          qaStatus: c.beforeAsset.qaStatus,
          sha256: c.beforeAsset.sha256,
        }
      : null,
    after: c.afterAsset
      ? {
          providerAssetId: c.afterAsset.providerAssetId,
          acquiredAt: c.afterAsset.acquiredAt.toISOString(),
          coveragePct: c.afterAsset.coveragePct,
          qaStatus: c.afterAsset.qaStatus,
          sha256: c.afterAsset.sha256,
        }
      : null,
    changedAreaHa: c.changedAreaHa,
    ndviDelta: c.ndviDelta,
    bareSoilDelta: c.bareSoilDelta,
    dwTreeProbDelta: c.dwTreeProbDelta,
    dwBareProbDelta: c.dwBareProbDelta,
    coveragePct: c.coveragePct,
    methodVersion: c.methodVersion,
    screeningRule: c.screeningRule,
    uncertaintyNotes: c.uncertaintyNotes,
    assessment: c.assessments[0]
      ? {
          decision: c.assessments[0].decision,
          rationale: c.assessments[0].rationale,
          permitStatus: c.assessments[0].permitStatus,
          nextAction: c.assessments[0].nextAction,
          reviewerName: c.assessments[0].reviewer.name,
          createdAt: c.assessments[0].createdAt.toISOString(),
        }
      : null,
    caseRevision: c.revision,
    requestedBy: session.userId,
    requestedAt: new Date().toISOString(),
    lang,
  }

  const nextVersion = (c.reportVersions[0]?.version ?? 0) + 1

  const reportVersion = await db.reportVersion.create({
    data: {
      caseId,
      version: nextVersion,
      status: c.status === 'field_corroborated' ? 'field_corroborated' : c.status === 'reviewed' ? 'reviewed' : 'draft',
      factSnapshotJson: JSON.stringify(snapshot),
      pdfUri: `/assets/reports/${c.caseKey}-v${nextVersion}.pdf`,
      pdfSha256: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),
      requestedById: session.userId,
    },
  })

  // Queue render_pdf job (idempotent by jobKey)
  const jobKey = `render_pdf_${c.caseKey}_v${nextVersion}`
  await db.job.upsert({
    where: { jobKey },
    update: { state: 'queued', attempts: 0, error: null, payloadJson: JSON.stringify({ caseId, version: nextVersion, lang }) },
    create: {
      jobKey,
      jobType: 'render_pdf',
      state: 'queued',
      payloadJson: JSON.stringify({ caseId, version: nextVersion, lang }),
    },
  })

  await db.reviewHistory.create({
    data: {
      caseId,
      actorId: session.userId,
      action: 'report_requested',
      fromStatus: c.status,
      toStatus: c.status,
      note: `Report v${nextVersion} requested (${lang.toUpperCase()}).`,
    },
  })

  await db.notification.create({
    data: {
      userId: session.userId,
      dedupKey: `report_requested_${reportVersion.id}`,
      category: 'report',
      titleEn: `Report v${nextVersion} queued for ${c.caseKey}`,
      titleBn: `${c.caseKey} এর জন্য রিপোর্ট v${nextVersion} সারিবদ্ধ`,
      bodyEn: `PDF generation queued. Status: ${reportVersion.status}.`,
      bodyBn: `PDF তৈরি সারিবদ্ধ। অবস্থা: ${reportVersion.status}।`,
      severity: 'info',
    },
  })

  return NextResponse.json({ ok: true, version: nextVersion, reportVersionId: reportVersion.id })
}
