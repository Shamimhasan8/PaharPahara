// PaharPahara — shared types for the dashboard
// Keeps client/server shape in sync without sharing Prisma internals.

export type Role = 'admin' | 'doe_reviewer' | 'forest_officer' | 'preparedness' | 'viewer'
export type Lang = 'en' | 'bn'

export type AccessState = 'live' | 'stale' | 'historical_replay' | 'unavailable'

export interface SiteDTO {
  id: string
  slug: string
  nameEn: string
  nameBn: string
  district: string
  lat: number
  lng: number
  geometryJson: string
  areaHectares: number
  elevationM: number
  slopeMaxDeg: number | null
  jurisdiction: string
  verificationSrc: string | null
}

export interface RawAssetDTO {
  id: string
  adapter: string
  product: string
  providerAssetId: string
  acquiredAt: string
  validStart: string
  validEnd: string
  retrievalTime: string
  grid: string | null
  qaStatus: string
  coveragePct: number | null
  fileUri: string
  sha256: string
  units: string | null
  licence: string
}

export interface CaseDTO {
  id: string
  caseKey: string
  siteId: string
  siteNameEn: string
  siteNameBn: string
  siteSlug: string
  status: string
  disturbanceType: string | null
  detectedAt: string
  beforeAsset: RawAssetDTO | null
  afterAsset: RawAssetDTO | null
  changedAreaHa: number | null
  ndviDelta: number | null
  bareSoilDelta: number | null
  dwTreeProbDelta: number | null
  dwBareProbDelta: number | null
  coveragePct: number | null
  methodVersion: string | null
  screeningRule: string | null
  uncertaintyNotes: string | null
  revision: number
  assessment: {
    id: string
    decision: string
    rationale: string
    permitStatus: string | null
    nextAction: string | null
    reviewerName: string
    createdAt: string
  } | null
  reviewHistory: Array<{
    id: string
    action: string
    fromStatus: string | null
    toStatus: string | null
    note: string | null
    actorName: string
    createdAt: string
  }>
  reportVersions: Array<{
    id: string
    version: number
    status: string
    pdfUri: string | null
    pdfSha256: string | null
    createdAt: string
  }>
}

export interface WeatherIntervalDTO {
  id: string
  source: string
  intervalStart: string
  intervalEnd: string
  valueMm: number
  isForecast: boolean
  isComplete: boolean
  memberCount: number | null
  exceedanceProb: number | null
}

export interface BulletinDTO {
  id: string
  capIdentifier: string
  sender: string
  messageType: string
  sentAt: string
  effectiveAt: string | null
  onsetAt: string | null
  expiresAt: string | null
  textEffectiveStart: string | null
  textEffectiveEnd: string | null
  hasValidityConflict: boolean
  headlineEn: string
  headlineBn: string
  descriptionEn: string
  descriptionBn: string
  areaDesc: string
  geometryJson: string | null
}

export interface SourceDTO {
  id: string
  adapter: string
  product: string
  version: string
  licence: string
  accessState: AccessState
  lastCheckedAt: string | null
  notes: string | null
}

export interface JobDTO {
  id: string
  jobKey: string
  jobType: string
  state: string
  payloadJson: string
  attempts: number
  maxAttempts: number
  leaseOwner: string | null
  leaseExpiresAt: string | null
  lastHeartbeat: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationDTO {
  id: string
  category: string
  titleEn: string
  titleBn: string
  bodyEn: string
  bodyBn: string
  severity: string
  read: boolean
  createdAt: string
}

export interface DashboardDataDTO {
  sites: SiteDTO[]
  cases: CaseDTO[]
  bulletins: BulletinDTO[]
  sources: SourceDTO[]
  jobs: JobDTO[]
  notifications: NotificationDTO[]
  rainfallSummary: Record<string, { total24h: number; total72h: number; complete: boolean; asOf: string | null }>
}
