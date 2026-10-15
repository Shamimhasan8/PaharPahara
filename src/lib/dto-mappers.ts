// PaharPahara — DTO mappers
import type {
  Case,
  RawAsset,
  Site,
  SourceRegistry,
  Bulletin,
  Job,
  Notification,
  WeatherInterval,
} from '@prisma/client'
import type {
  CaseDTO,
  RawAssetDTO,
  SiteDTO,
  SourceDTO,
  BulletinDTO,
  JobDTO,
  NotificationDTO,
  WeatherIntervalDTO,
} from '@/lib/types/dto'

export function mapSite(s: Site): SiteDTO {
  return {
    id: s.id,
    slug: s.slug,
    nameEn: s.nameEn,
    nameBn: s.nameBn,
    district: s.district,
    lat: s.lat,
    lng: s.lng,
    geometryJson: s.geometryJson,
    areaHectares: s.areaHectares,
    elevationM: s.elevationM,
    slopeMaxDeg: s.slopeMaxDeg,
    jurisdiction: s.jurisdiction,
    verificationSrc: s.verificationSrc,
  }
}

export function mapRawAsset(a: RawAsset, src: Pick<SourceRegistry, 'adapter' | 'product' | 'licence'>): RawAssetDTO {
  return {
    id: a.id,
    adapter: src.adapter,
    product: src.product,
    providerAssetId: a.providerAssetId,
    acquiredAt: a.acquiredAt.toISOString(),
    validStart: a.validStart.toISOString(),
    validEnd: a.validEnd.toISOString(),
    retrievalTime: a.retrievalTime.toISOString(),
    grid: a.grid,
    qaStatus: a.qaStatus,
    coveragePct: a.coveragePct,
    fileUri: a.fileUri,
    sha256: a.sha256,
    units: a.units,
    licence: src.licence,
  }
}

export function mapCase(
  c: Case & {
    site: Site
    beforeAsset: (RawAsset & { source: SourceRegistry }) | null
    afterAsset: (RawAsset & { source: SourceRegistry }) | null
    assessments: Array<{
      id: string
      decision: string
      rationale: string
      permitStatus: string | null
      nextAction: string | null
      reviewer: { name: string }
      createdAt: Date
    }>
    reviews: Array<{
      id: string
      action: string
      fromStatus: string | null
      toStatus: string | null
      note: string | null
      actor: { name: string }
      createdAt: Date
    }>
    reportVersions: Array<{
      id: string
      version: number
      status: string
      pdfUri: string | null
      pdfSha256: string | null
      createdAt: Date
    }>
  },
): CaseDTO {
  return {
    id: c.id,
    caseKey: c.caseKey,
    siteId: c.siteId,
    siteNameEn: c.site.nameEn,
    siteNameBn: c.site.nameBn,
    siteSlug: c.site.slug,
    status: c.status,
    disturbanceType: c.disturbanceType,
    detectedAt: c.detectedAt.toISOString(),
    beforeAsset: c.beforeAsset ? mapRawAsset(c.beforeAsset, c.beforeAsset.source) : null,
    afterAsset: c.afterAsset ? mapRawAsset(c.afterAsset, c.afterAsset.source) : null,
    changedAreaHa: c.changedAreaHa,
    ndviDelta: c.ndviDelta,
    bareSoilDelta: c.bareSoilDelta,
    dwTreeProbDelta: c.dwTreeProbDelta,
    dwBareProbDelta: c.dwBareProbDelta,
    coveragePct: c.coveragePct,
    methodVersion: c.methodVersion,
    screeningRule: c.screeningRule,
    uncertaintyNotes: c.uncertaintyNotes,
    revision: c.revision,
    assessment: c.assessments[0]
      ? {
          id: c.assessments[0].id,
          decision: c.assessments[0].decision,
          rationale: c.assessments[0].rationale,
          permitStatus: c.assessments[0].permitStatus,
          nextAction: c.assessments[0].nextAction,
          reviewerName: c.assessments[0].reviewer.name,
          createdAt: c.assessments[0].createdAt.toISOString(),
        }
      : null,
    reviewHistory: c.reviews.map((r) => ({
      id: r.id,
      action: r.action,
      fromStatus: r.fromStatus,
      toStatus: r.toStatus,
      note: r.note,
      actorName: r.actor.name,
      createdAt: r.createdAt.toISOString(),
    })),
    reportVersions: c.reportVersions.map((v) => ({
      id: v.id,
      version: v.version,
      status: v.status,
      pdfUri: v.pdfUri,
      pdfSha256: v.pdfSha256,
      createdAt: v.createdAt.toISOString(),
    })),
  }
}

export function mapBulletin(b: Bulletin): BulletinDTO {
  return {
    id: b.id,
    capIdentifier: b.capIdentifier,
    sender: b.sender,
    messageType: b.messageType,
    sentAt: b.sentAt.toISOString(),
    effectiveAt: b.effectiveAt?.toISOString() ?? null,
    onsetAt: b.onsetAt?.toISOString() ?? null,
    expiresAt: b.expiresAt?.toISOString() ?? null,
    textEffectiveStart: b.textEffectiveStart?.toISOString() ?? null,
    textEffectiveEnd: b.textEffectiveEnd?.toISOString() ?? null,
    hasValidityConflict: b.hasValidityConflict,
    headlineEn: b.headlineEn,
    headlineBn: b.headlineBn,
    descriptionEn: b.descriptionEn,
    descriptionBn: b.descriptionBn,
    areaDesc: b.areaDesc,
    geometryJson: b.geometryJson,
  }
}

export function mapSource(s: SourceRegistry): SourceDTO {
  return {
    id: s.id,
    adapter: s.adapter,
    product: s.product,
    version: s.version,
    licence: s.licence,
    accessState: s.accessState as SourceDTO['accessState'],
    lastCheckedAt: s.lastCheckedAt?.toISOString() ?? null,
    notes: s.notes,
  }
}

export function mapJob(j: Job): JobDTO {
  return {
    id: j.id,
    jobKey: j.jobKey,
    jobType: j.jobType,
    state: j.state,
    payloadJson: j.payloadJson,
    attempts: j.attempts,
    maxAttempts: j.maxAttempts,
    leaseOwner: j.leaseOwner,
    leaseExpiresAt: j.leaseExpiresAt?.toISOString() ?? null,
    lastHeartbeat: j.lastHeartbeat?.toISOString() ?? null,
    error: j.error,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  }
}

export function mapNotification(n: Notification): NotificationDTO {
  return {
    id: n.id,
    category: n.category,
    titleEn: n.titleEn,
    titleBn: n.titleBn,
    bodyEn: n.bodyEn,
    bodyBn: n.bodyBn,
    severity: n.severity,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }
}

export function mapWeather(w: WeatherInterval): WeatherIntervalDTO {
  return {
    id: w.id,
    source: w.source,
    intervalStart: w.intervalStart.toISOString(),
    intervalEnd: w.intervalEnd.toISOString(),
    valueMm: w.valueMm,
    isForecast: w.isForecast,
    isComplete: w.isComplete,
    memberCount: w.memberCount,
    exceedanceProb: w.exceedanceProb,
  }
}

// Compute completeness-aware rainfall totals.
// Returns totalMm, complete boolean (all intervals present), and the asOf timestamp (end of latest contiguous received interval).
export function computeRainfallTotals(
  intervals: WeatherInterval[],
  windowHours: number,
): { totalMm: number; complete: boolean; asOf: Date | null; expectedCount: number; actualCount: number } {
  const observations = intervals
    .filter((w) => !w.isForecast)
    .sort((a, b) => a.intervalStart.getTime() - b.intervalStart.getTime())
  if (observations.length === 0) {
    return { totalMm: 0, complete: false, asOf: null, expectedCount: 0, actualCount: 0 }
  }
  const last = observations[observations.length - 1]
  const windowStart = new Date(last.intervalEnd.getTime() - windowHours * 60 * 60 * 1000)
  const inWindow = observations.filter((w) => w.intervalEnd > windowStart && w.intervalEnd <= last.intervalEnd)
  // Expected count based on median interval duration
  const intervals2 = inWindow.length >= 2 ? inWindow[1].intervalStart.getTime() - inWindow[0].intervalStart.getTime() : 30 * 60 * 1000
  const expectedCount = Math.round((windowHours * 60 * 60 * 1000) / intervals2)
  const complete = inWindow.length >= expectedCount && inWindow.every((w) => w.isComplete)
  const totalMm = inWindow.reduce((sum, w) => sum + w.valueMm, 0)
  return {
    totalMm,
    complete,
    asOf: last.intervalEnd,
    expectedCount,
    actualCount: inWindow.length,
  }
}
