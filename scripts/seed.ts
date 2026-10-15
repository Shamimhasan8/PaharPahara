// PaharPahara — seed script
// Populates SQLite with realistic historical/demo data labelled as historical_replay.
// Run with: bun run scripts/seed.ts

import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const db = new PrismaClient()

// Tiny hash helper for demo asset integrity
function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

// Demo password hash (NOT secure — for prototype only). Format: demo$<plaintext>
function demoHash(pw: string): string {
  return `demo$${sha256(pw).slice(0, 32)}`
}

async function main() {
  console.log('Seeding PaharPahara prototype database...')

  // ---------- Users ----------
  const users = await Promise.all([
    db.user.upsert({
      where: { email: 'admin@paharpahara.bd' },
      update: {},
      create: {
        email: 'admin@paharpahara.bd',
        name: 'Ayesha Rahman',
        password: demoHash('admin123'),
        role: 'admin',
        agency: 'Department of Environment',
      },
    }),
    db.user.upsert({
      where: { email: 'reviewer@paharpahara.bd' },
      update: {},
      create: {
        email: 'reviewer@paharpahara.bd',
        name: 'Tanvir Hossain',
        password: demoHash('reviewer123'),
        role: 'doe_reviewer',
        agency: 'Department of Environment — Chattogram',
      },
    }),
    db.user.upsert({
      where: { email: 'forest@paharpahara.bd' },
      update: {},
      create: {
        email: 'forest@paharpahara.bd',
        name: 'Mizanur Karim',
        password: demoHash('forest123'),
        role: 'forest_officer',
        agency: 'Forest Department — Chattogram Range',
      },
    }),
    db.user.upsert({
      where: { email: 'preparedness@paharpahara.bd' },
      update: {},
      create: {
        email: 'preparedness@paharpahara.bd',
        name: 'Farhana Akter',
        password: demoHash('prep123'),
        role: 'preparedness',
        agency: 'Disaster Management — Chattogram',
      },
    }),
    db.user.upsert({
      where: { email: 'viewer@paharpahara.bd' },
      update: {},
      create: {
        email: 'viewer@paharpahara.bd',
        name: 'Demo Viewer',
        password: demoHash('viewer123'),
        role: 'viewer',
        agency: 'Public read-only',
      },
    }),
  ])
  console.log(`Seeded ${users.length} users`)

  // ---------- Sites (3 hills in Chattogram) ----------
  const polygon = (cx: number, cy: number, dx = 0.004, dy = 0.003) =>
    JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [cx - dx, cy - dy],
          [cx + dx, cy - dy],
          [cx + dx, cy + dy],
          [cx - dx, cy + dy],
          [cx - dx, cy - dy],
        ],
      ],
    })

  const chashma = await db.site.upsert({
    where: { slug: 'chashma-hill' },
    update: {},
    create: {
      slug: 'chashma-hill',
      nameEn: 'Chashma Hill (Mayor Goli)',
      nameBn: 'চাষ্মা পাহাড় (মেয়র গলি)',
      district: 'Chattogram City',
      lat: 22.3612,
      lng: 91.8198,
      geometryJson: polygon(91.8198, 22.3612),
      areaHectares: 18.4,
      elevationM: 78,
      slopeMaxDeg: 42,
      jurisdiction: 'verified_doe',
      verificationSrc: 'DoE Chattogram range office letter, 2025',
    },
  })

  const salimpur = await db.site.upsert({
    where: { slug: 'jangal-salimpur' },
    update: {},
    create: {
      slug: 'jangal-salimpur',
      nameEn: 'Jangal Salimpur Study Area',
      nameBn: 'জঙ্গল সালিমপুর স্টাডি এলাকা',
      district: 'Chattogram — Patiya',
      lat: 22.3039,
      lng: 91.8716,
      geometryJson: polygon(91.8716, 22.3039, 0.005, 0.004),
      areaHectares: 31.2,
      elevationM: 64,
      slopeMaxDeg: 35,
      jurisdiction: 'unverified',
      verificationSrc: null,
    },
  })

  const nagin = await db.site.upsert({
    where: { slug: 'nagin-hill' },
    update: {},
    create: {
      slug: 'nagin-hill',
      nameEn: 'Nagin Hill',
      nameBn: 'নাগিন পাহাড়',
      district: 'Chattogram — Bayezid',
      lat: 22.4278,
      lng: 91.8103,
      geometryJson: polygon(91.8103, 22.4278),
      areaHectares: 12.7,
      elevationM: 92,
      slopeMaxDeg: 48,
      jurisdiction: 'verified_forest',
      verificationSrc: 'Forest Department Records, 2024',
    },
  })
  console.log('Seeded 3 sites')

  // ---------- Source registry ----------
  const sources = await Promise.all([
    db.sourceRegistry.upsert({
      where: { adapter: 'sentinel2_sr' },
      update: { lastCheckedAt: new Date('2026-10-09T03:00:00Z') },
      create: {
        adapter: 'sentinel2_sr',
        product: 'COPERNICUS/S2_SR_HARMONIZED',
        version: '2026_processor',
        licence: 'Copernicus Sentinel-2 data, ESA. Modified by PaharPahara for evidence review.',
        accessState: 'historical_replay',
        lastCheckedAt: new Date('2026-10-09T03:00:00Z'),
        notes: 'Historical replay assets for Chashma, Salimpur and Nagin; live acquisition gated by EE credentials.',
      },
    }),
    db.sourceRegistry.upsert({
      where: { adapter: 'cloud_score_plus' },
      update: { lastCheckedAt: new Date('2026-10-09T03:00:00Z') },
      create: {
        adapter: 'cloud_score_plus',
        product: 'GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED',
        version: 'v1',
        licence: 'Google Cloud Score+ — Apache-2.0',
        accessState: 'historical_replay',
        lastCheckedAt: new Date('2026-10-09T03:00:00Z'),
        notes: 'Replaces QA60 reliance for historical pairs; cs_cdf >= 0.60 used as initial threshold.',
      },
    }),
    db.sourceRegistry.upsert({
      where: { adapter: 'dynamic_world' },
      update: {},
      create: {
        adapter: 'dynamic_world',
        product: 'GOOGLE/DYNAMICWORLD/V1',
        version: 'v1',
        licence: 'Google Dynamic World — CC-BY-4.0',
        accessState: 'historical_replay',
        notes: 'Corroborating evidence only — derived from Sentinel-2, not an independent sensor.',
      },
    }),
    db.sourceRegistry.upsert({
      where: { adapter: 'copernicus_dem' },
      update: {},
      create: {
        adapter: 'copernicus_dem',
        product: 'COPERNICUS/DEM/GLO30_2024_1',
        version: '2024_1',
        licence: 'Copernicus DEM © ESA. Modified.',
        accessState: 'historical_replay',
        notes: '30 m surface model; cannot measure excavation volume or cliff geometry.',
      },
    }),
    db.sourceRegistry.upsert({
      where: { adapter: 'imerg_early' },
      update: { lastCheckedAt: new Date('2026-10-09T02:30:00Z') },
      create: {
        adapter: 'imerg_early',
        product: 'GPM_3IMERGHE',
        version: 'V07 (Early)',
        licence: 'NASA IMERG — public domain (NASA data).',
        accessState: 'historical_replay',
        lastCheckedAt: new Date('2026-10-09T02:30:00Z'),
        notes: 'Half-hour rate (mm/hour). rate × 0.5h accumulated. ~10 km cell — multiple hills share a cell.',
      },
    }),
    db.sourceRegistry.upsert({
      where: { adapter: 'gsmap' },
      update: {},
      create: {
        adapter: 'gsmap',
        product: 'JAXA/GPM_L3/GSMaP/v8/operational',
        version: 'v8 operational',
        licence: 'JAXA GSMaP — terms apply',
        accessState: 'unavailable',
        notes: 'Cross-check adapter; not interchangeable with IMERG. Pending verification.',
      },
    }),
    db.sourceRegistry.upsert({
      where: { adapter: 'open_meteo' },
      update: { lastCheckedAt: new Date('2026-10-09T03:30:00Z') },
      create: {
        adapter: 'open_meteo',
        product: 'Open-Meteo Forecast (gfs_seamless)',
        version: 'gfs_seamless',
        licence: 'Open-Meteo — CC-BY-4.0',
        accessState: 'live',
        lastCheckedAt: new Date('2026-10-09T03:30:00Z'),
        notes: 'Hourly precipitation; precipitation belongs to the preceding hour.',
      },
    }),
    db.sourceRegistry.upsert({
      where: { adapter: 'open_meteo_ensemble' },
      update: {},
      create: {
        adapter: 'open_meteo_ensemble',
        product: 'Open-Meteo Ensemble',
        version: 'weathernext2 (pending)',
        licence: 'Open-Meteo Ensemble — CC-BY-4.0',
        accessState: 'unavailable',
        notes: 'Gated: requires verification of model identifier & member count before activation.',
      },
    }),
    db.sourceRegistry.upsert({
      where: { adapter: 'bmd_cap' },
      update: { lastCheckedAt: new Date('2026-10-09T03:15:00Z') },
      create: {
        adapter: 'bmd_cap',
        product: 'BMD CAP 1.2',
        version: 'cap_1_2',
        licence: 'Bangladesh Meteorological Department — public alerts',
        accessState: 'historical_replay',
        lastCheckedAt: new Date('2026-10-09T03:15:00Z'),
        notes: 'Dual discovery: cap.bmd.gov.bd/api/cap/rss.xml + cap.bmd.gov.bd/bmd-cap-alerts/',
      },
    }),
  ])
  console.log(`Seeded ${sources.length} sources`)

  const s2 = sources.find((s) => s.adapter === 'sentinel2_sr')!
  const csp = sources.find((s) => s.adapter === 'cloud_score_plus')!
  const dw = sources.find((s) => s.adapter === 'dynamic_world')!
  const dem = sources.find((s) => s.adapter === 'copernicus_dem')!

  // ---------- Raw assets: Sentinel-2 before/after + DEM + DW ----------
  const chashmaBefore = await db.rawAsset.create({
    data: {
      sourceId: s2.id,
      providerAssetId: 'S2B_T43QCE_20260622T045631',
      siteId: chashma.id,
      acquiredAt: new Date('2026-06-22T04:56:31Z'),
      validStart: new Date('2026-06-22T04:56:31Z'),
      validEnd: new Date('2026-06-22T04:56:31Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m — T43QCE',
      qaStatus: 'ok',
      coveragePct: 92,
      fileUri: '/assets/satellite/chashma_before_2026-06-22.svg',
      sha256: sha256('chashma_before_20260622'),
      units: 'reflectance (B2/B3/B4/B8)',
    },
  })

  const chashmaAfter = await db.rawAsset.create({
    data: {
      sourceId: s2.id,
      providerAssetId: 'S2A_T43QCE_20260709T045551',
      siteId: chashma.id,
      acquiredAt: new Date('2026-07-09T04:55:51Z'),
      validStart: new Date('2026-07-09T04:55:51Z'),
      validEnd: new Date('2026-07-09T04:55:51Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m — T43QCE',
      qaStatus: 'partial',
      coveragePct: 71,
      fileUri: '/assets/satellite/chashma_after_2026-07-09.svg',
      sha256: sha256('chashma_after_20260709'),
      units: 'reflectance (B2/B3/B4/B8)',
    },
  })

  await db.rawAsset.create({
    data: {
      sourceId: csp.id,
      providerAssetId: 'CS_PLUS_S2B_20260622T045631_43QCE',
      siteId: chashma.id,
      acquiredAt: new Date('2026-06-22T04:56:31Z'),
      validStart: new Date('2026-06-22T04:56:31Z'),
      validEnd: new Date('2026-06-22T04:56:31Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m',
      qaStatus: 'ok',
      coveragePct: 92,
      fileUri: 'internal://cloudscore/20260622',
      sha256: sha256('csp_before'),
      units: 'cs_cdf',
    },
  })

  await db.rawAsset.create({
    data: {
      sourceId: csp.id,
      providerAssetId: 'CS_PLUS_S2A_20260709T045551_43QCE',
      siteId: chashma.id,
      acquiredAt: new Date('2026-07-09T04:55:51Z'),
      validStart: new Date('2026-07-09T04:55:51Z'),
      validEnd: new Date('2026-07-09T04:55:51Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m',
      qaStatus: 'partial',
      coveragePct: 71,
      fileUri: 'internal://cloudscore/20260709',
      sha256: sha256('csp_after'),
      units: 'cs_cdf',
    },
  })

  await db.rawAsset.create({
    data: {
      sourceId: dem.id,
      providerAssetId: 'COPDEM_GLO30_43QCE',
      siteId: chashma.id,
      acquiredAt: new Date('2024-01-01T00:00:00Z'),
      validStart: new Date('2024-01-01T00:00:00Z'),
      validEnd: new Date('2024-01-01T00:00:00Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '30m',
      qaStatus: 'ok',
      coveragePct: 100,
      fileUri: 'internal://dem/copernicus_glo30',
      sha256: sha256('copdem_glo30_43qce'),
      units: 'metres (surface model)',
    },
  })

  await db.rawAsset.create({
    data: {
      sourceId: dw.id,
      providerAssetId: 'DW_20260622T045631_43QCE',
      siteId: chashma.id,
      acquiredAt: new Date('2026-06-22T04:56:31Z'),
      validStart: new Date('2026-06-22T04:56:31Z'),
      validEnd: new Date('2026-06-22T04:56:31Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m',
      qaStatus: 'ok',
      coveragePct: 92,
      fileUri: 'internal://dw/20260622',
      sha256: sha256('dw_before'),
      units: 'probability (0..1)',
    },
  })
  await db.rawAsset.create({
    data: {
      sourceId: dw.id,
      providerAssetId: 'DW_20260709T045551_43QCE',
      siteId: chashma.id,
      acquiredAt: new Date('2026-07-09T04:55:51Z'),
      validStart: new Date('2026-07-09T04:55:51Z'),
      validEnd: new Date('2026-07-09T04:55:51Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m',
      qaStatus: 'partial',
      coveragePct: 71,
      fileUri: 'internal://dw/20260709',
      sha256: sha256('dw_after'),
      units: 'probability (0..1)',
    },
  })

  const salimpurBefore = await db.rawAsset.create({
    data: {
      sourceId: s2.id,
      providerAssetId: 'S2B_T43QDE_20260704T045631',
      siteId: salimpur.id,
      acquiredAt: new Date('2026-07-04T04:56:31Z'),
      validStart: new Date('2026-07-04T04:56:31Z'),
      validEnd: new Date('2026-07-04T04:56:31Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m — T43QDE',
      qaStatus: 'ok',
      coveragePct: 88,
      fileUri: '/assets/satellite/salimpur_before_2026-07-04.svg',
      sha256: sha256('salimpur_before'),
      units: 'reflectance (B2/B3/B4/B8)',
    },
  })
  const salimpurAfter = await db.rawAsset.create({
    data: {
      sourceId: s2.id,
      providerAssetId: 'S2A_T43QDE_20260712T045551',
      siteId: salimpur.id,
      acquiredAt: new Date('2026-07-12T04:55:51Z'),
      validStart: new Date('2026-07-12T04:55:51Z'),
      validEnd: new Date('2026-07-12T04:55:51Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m — T43QDE',
      qaStatus: 'ok',
      coveragePct: 84,
      fileUri: '/assets/satellite/salimpur_after_2026-07-12.svg',
      sha256: sha256('salimpur_after'),
      units: 'reflectance (B2/B3/B4/B8)',
    },
  })

  console.log('Seeded raw assets (S2 + CloudScore+ + DEM + DW)')

  // ---------- Cases ----------
  const chashmaCase = await db.case.create({
    data: {
      caseKey: 'CHASHMA-2026-07-08',
      siteId: chashma.id,
      status: 'under_review',
      disturbanceType: 'vegetation_clearance',
      detectedAt: new Date('2026-07-09T05:30:00Z'),
      beforeAssetId: chashmaBefore.id,
      afterAssetId: chashmaAfter.id,
      changedAreaHa: 1.34,
      ndviDelta: -0.27,
      bareSoilDelta: 0.41,
      dwTreeProbDelta: -0.32,
      dwBareProbDelta: 0.38,
      coveragePct: 71,
      methodVersion: 'cutwatch-v0.3-spectral-baseline',
      screeningRule: 'salimpur-monitor-v0.2',
      uncertaintyNotes:
        '71% common valid coverage (above 60% dev threshold). Cloud Score+ cs_cdf=0.71 for after scene. DEM slope context max 42°. Cannot establish excavation volume from DEM.',
      revision: 1,
    },
  })

  const salimpurCase = await db.case.create({
    data: {
      caseKey: 'SALIMPUR-2026-07-12',
      siteId: salimpur.id,
      status: 'candidate',
      disturbanceType: 'seasonal',
      detectedAt: new Date('2026-07-12T05:00:00Z'),
      beforeAssetId: salimpurBefore.id,
      afterAssetId: salimpurAfter.id,
      changedAreaHa: 0.42,
      ndviDelta: -0.09,
      bareSoilDelta: 0.06,
      dwTreeProbDelta: -0.05,
      dwBareProbDelta: 0.07,
      coveragePct: 84,
      methodVersion: 'cutwatch-v0.3-spectral-baseline',
      screeningRule: 'salimpur-monitor-v0.2',
      uncertaintyNotes:
        'Below 0.5 ha candidate polygon filter. Likely seasonal leaf-drop rather than cutting; reviewer should mark "seasonal effect" if confirmed.',
      revision: 1,
    },
  })

  const naginBefore = await db.rawAsset.create({
    data: {
      sourceId: s2.id,
      providerAssetId: 'S2A_T43QEE_20260511T045551',
      siteId: nagin.id,
      acquiredAt: new Date('2026-05-11T04:55:51Z'),
      validStart: new Date('2026-05-11T04:55:51Z'),
      validEnd: new Date('2026-05-11T04:55:51Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m — T43QEE',
      qaStatus: 'ok',
      coveragePct: 95,
      fileUri: '/assets/satellite/nagin_before_2026-05-11.svg',
      sha256: sha256('nagin_before'),
      units: 'reflectance (B2/B3/B4/B8)',
    },
  })
  const naginAfter = await db.rawAsset.create({
    data: {
      sourceId: s2.id,
      providerAssetId: 'S2B_T43QEE_20260618T045631',
      siteId: nagin.id,
      acquiredAt: new Date('2026-06-18T04:56:31Z'),
      validStart: new Date('2026-06-18T04:56:31Z'),
      validEnd: new Date('2026-06-18T04:56:31Z'),
      retrievalTime: new Date('2026-10-09T03:00:00Z'),
      grid: '10m — T43QEE',
      qaStatus: 'ok',
      coveragePct: 91,
      fileUri: '/assets/satellite/nagin_after_2026-06-18.svg',
      sha256: sha256('nagin_after'),
      units: 'reflectance (B2/B3/B4/B8)',
    },
  })

  const naginCase = await db.case.create({
    data: {
      caseKey: 'NAGIN-2026-06-18',
      siteId: nagin.id,
      status: 'reviewed',
      disturbanceType: 'vegetation_clearance',
      detectedAt: new Date('2026-06-19T03:00:00Z'),
      beforeAssetId: naginBefore.id,
      afterAssetId: naginAfter.id,
      changedAreaHa: 2.18,
      ndviDelta: -0.34,
      bareSoilDelta: 0.52,
      dwTreeProbDelta: -0.41,
      dwBareProbDelta: 0.49,
      coveragePct: 91,
      methodVersion: 'cutwatch-v0.3-spectral-baseline',
      screeningRule: 'salimpur-monitor-v0.2',
      uncertaintyNotes:
        'Reviewed 2026-06-25. Forest Department jurisdiction verified. Field officer corroborated on 2026-06-27.',
      revision: 3,
    },
  })

  console.log('Seeded 3 cases')

  // ---------- Review history ----------
  await db.reviewHistory.create({
    data: {
      caseId: chashmaCase.id,
      actorId: users[1].id,
      action: 'opened',
      fromStatus: null,
      toStatus: 'candidate',
      note: 'Auto-generated by CutWatch pipeline from 2026-07-09 acquisition pair.',
    },
  })
  await db.reviewHistory.create({
    data: {
      caseId: chashmaCase.id,
      actorId: users[1].id,
      action: 'status_changed',
      fromStatus: 'candidate',
      toStatus: 'under_review',
      note: 'Reviewer picked up case for inspection on 2026-07-10.',
    },
  })
  await db.reviewHistory.create({
    data: {
      caseId: naginCase.id,
      actorId: users[2].id,
      action: 'opened',
      fromStatus: null,
      toStatus: 'candidate',
      note: 'Auto-generated from 2026-06-18 acquisition pair.',
    },
  })
  await db.reviewHistory.create({
    data: {
      caseId: naginCase.id,
      actorId: users[1].id,
      action: 'status_changed',
      fromStatus: 'candidate',
      toStatus: 'under_review',
    },
  })
  await db.reviewHistory.create({
    data: {
      caseId: naginCase.id,
      actorId: users[1].id,
      action: 'status_changed',
      fromStatus: 'under_review',
      toStatus: 'field_verification',
      note: 'Field verification requested — forest overlap confirmed.',
    },
  })
  await db.reviewHistory.create({
    data: {
      caseId: naginCase.id,
      actorId: users[2].id,
      action: 'status_changed',
      fromStatus: 'field_verification',
      toStatus: 'field_corroborated',
      note: 'Forest officer corroborated cutting on site visit 2026-06-27.',
    },
  })
  const naginAssessment = await db.assessment.create({
    data: {
      caseId: naginCase.id,
      reviewerId: users[1].id,
      decision: 'approved',
      rationale:
        'Confirmed vegetation clearance over 2.18 ha within verified Forest Department jurisdiction. Sentinel-2 before/after pair quality 91%. Dynamic World tree probability dropped 0.41, bare probability rose 0.49. Field visit corroborated on 2026-06-27. Forward to enforcement under Environment Conservation Act section 6B.',
      permitStatus: 'missing',
      nextAction: 'Forward to DoE enforcement for clearance/permit check under ECA 6B',
      caseRevision: 3,
    },
  })
  await db.reviewHistory.create({
    data: {
      caseId: naginCase.id,
      assessmentId: naginAssessment.id,
      actorId: users[1].id,
      action: 'reviewed',
      fromStatus: 'field_corroborated',
      toStatus: 'reviewed',
    },
  })

  await db.reportVersion.create({
    data: {
      caseId: naginCase.id,
      version: 1,
      status: 'field_corroborated',
      factSnapshotJson: JSON.stringify({
        caseKey: 'NAGIN-2026-06-18',
        siteNameEn: 'Nagin Hill',
        siteNameBn: 'নাগিন পাহাড়',
        siteDistrict: 'Chattogram — Bayezid',
        jurisdiction: 'verified_forest',
        status: 'reviewed',
        disturbanceType: 'vegetation_clearance',
        detectedAt: '2026-06-19T03:00:00.000Z',
        before: {
          providerAssetId: 'S2A_T43QEE_20260511T045551',
          acquiredAt: '2026-05-11T04:55:51.000Z',
          coveragePct: 95,
          qaStatus: 'ok',
          sha256: sha256('nagin_before'),
        },
        after: {
          providerAssetId: 'S2B_T43QEE_20260618T045631',
          acquiredAt: '2026-06-18T04:56:31.000Z',
          coveragePct: 91,
          qaStatus: 'ok',
          sha256: sha256('nagin_after'),
        },
        changedAreaHa: 2.18,
        ndviDelta: -0.34,
        bareSoilDelta: 0.52,
        dwTreeProbDelta: -0.41,
        dwBareProbDelta: 0.49,
        coveragePct: 91,
        methodVersion: 'cutwatch-v0.3-spectral-baseline',
        screeningRule: 'salimpur-monitor-v0.2',
        uncertaintyNotes:
          'Reviewed 2026-06-25. Forest Department jurisdiction verified. Field officer corroborated on 2026-06-27. DEM slope context max 48°. Cannot establish excavation volume from DEM.',
        assessment: {
          decision: 'approved',
          rationale:
            'Confirmed vegetation clearance over 2.18 ha within verified Forest Department jurisdiction. Sentinel-2 before/after pair quality 91%. Dynamic World tree probability dropped 0.41, bare probability rose 0.49. Field visit corroborated on 2026-06-27. Forward to enforcement under Environment Conservation Act section 6B.',
          permitStatus: 'missing',
          nextAction: 'Forward to DoE enforcement for clearance/permit check under ECA 6B',
          reviewerName: 'Tanvir Hossain',
          createdAt: '2026-06-25T10:00:00.000Z',
        },
        caseRevision: 3,
        requestedBy: users[1].id,
        requestedAt: '2026-06-27T10:30:00.000Z',
        lang: 'en',
      }),
      pdfUri: '/assets/reports/NAGIN-2026-06-18-v1.pdf',
      pdfSha256: sha256('nagin_report_v1_full'),
      requestedById: users[1].id,
    },
  })

  console.log('Seeded review history + assessment + report')

  // ---------- Weather: IMERG half-hour intervals for Chashma around 8 July ----------
  const imergStart = new Date('2026-07-07T18:00:00Z')
  const rates = [
    0.2, 0.3, 0.1, 0.0, 0.4, 0.6, 1.2, 2.1, 3.4, 4.2, 5.1, 6.8,
    7.2, 8.4, 9.1, 7.6, 5.4, 4.1, 3.0, 2.2, 1.4, 0.9, 0.6, 0.3,
    0.4, 0.7, 1.1, 1.8, 2.6, 3.5, 4.8, 5.9, 6.2, 5.5, 4.3, 3.1,
    2.0, 1.2, 0.7, 0.5, 0.3, 0.2, 0.1, 0.0, 0.0, 0.1, 0.2, 0.1,
  ]
  for (let i = 0; i < 48; i++) {
    const start = new Date(imergStart.getTime() + i * 30 * 60 * 1000)
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    const isGap = i === 17 || i === 18 || i === 33
    await db.weatherInterval.create({
      data: {
        siteId: chashma.id,
        source: 'imerg_early',
        intervalStart: start,
        intervalEnd: end,
        valueMm: isGap ? 0 : rates[i] * 0.5,
        isForecast: false,
        isComplete: !isGap,
        retrievalTime: new Date('2026-10-09T02:30:00Z'),
      },
    })
  }

  const fcStart = new Date('2026-07-08T06:00:00Z')
  const fcRates = [
    0.0, 0.0, 0.1, 0.2, 0.4, 0.8, 1.5, 2.4, 3.6, 4.8, 5.5, 6.2,
    5.9, 4.7, 3.2, 2.0, 1.1, 0.6, 0.3, 0.1, 0.0, 0.0, 0.0, 0.0,
  ]
  for (let i = 0; i < 24; i++) {
    const start = new Date(fcStart.getTime() + i * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    await db.weatherInterval.create({
      data: {
        siteId: chashma.id,
        source: 'open_meteo',
        intervalStart: start,
        intervalEnd: end,
        valueMm: fcRates[i],
        isForecast: true,
        isComplete: true,
        issueRunTime: new Date('2026-07-08T06:00:00Z'),
        retrievalTime: new Date('2026-10-09T03:30:00Z'),
      },
    })
  }
  console.log('Seeded weather intervals (IMERG 48 + Open-Meteo 24)')

  // ---------- BMD CAP bulletins ----------
  await db.bulletin.create({
    data: {
      capIdentifier: '049e2b30-4935-4e7f-9b24-3b281728816d',
      sender: 'bmd-woc@bmd.gov.bd',
      messageType: 'alert',
      sentAt: new Date('2026-07-05T01:30:00Z'),
      effectiveAt: new Date('2026-07-05T07:00:00Z'),
      onsetAt: new Date('2026-07-05T07:00:00Z'),
      expiresAt: new Date('2026-07-06T07:00:00Z'),
      textEffectiveStart: new Date('2026-07-05T13:00:00Z'),
      textEffectiveEnd: new Date('2026-07-08T13:00:00Z'),
      hasValidityConflict: true,
      headlineEn: 'Heavy to very heavy rainfall may occur over Chattogram division',
      headlineBn: 'চট্টগ্রাম বিভাগে ভারী থেকে অতিভারী বৃষ্টিপাত হতে পারে',
      descriptionEn:
        'Landport signals: heavy (44-64 mm/24h) to very heavy (65-124 mm/24h) rainfall likely over Chattogram, Cox\'s Bazar, Rangamati, Khagrachari and Bandarban hill districts during the next 72 hours from 13:00 BST 5 July 2026. Landslides may occur in hilly regions.',
      descriptionBn:
        'ভবিষ্যতে ৭২ ঘণ্টা (৫ জুলাই ২০২৬, দুপুর ১টা থেকে) চট্টগ্রাম, কক্সবাজার, রাঙ্গামাটি, খাগড়াছড়ি ও বান্দরবান পার্বত্য জেলায় ভারী (৪৪-৬৪ মিমি/২৪ঘণ্টা) থেকে অতিভারী (৬৫-১২৪ মিমি/২৪ঘণ্টা) বৃষ্টিপাত হতে পারে। পার্বত্য এলাকায় ভূমিধস হতে পারে।',
      areaDesc: 'Chattogram, Cox\'s Bazar, Rangamati, Khagrachari, Bandarban',
      geometryJson: JSON.stringify({
        type: 'Polygon',
        coordinates: [
          [
            [90.5, 22.7],
            [92.7, 22.7],
            [92.7, 20.5],
            [90.5, 20.5],
            [90.5, 22.7],
          ],
        ],
      }),
      referencesJson: '[]',
    },
  })

  await db.bulletin.create({
    data: {
      capIdentifier: 'bmd-no-active-alert-2026-10-09',
      sender: 'bmd-woc@bmd.gov.bd',
      messageType: 'ack',
      sentAt: new Date('2026-10-09T00:00:00Z'),
      effectiveAt: new Date('2026-10-09T00:00:00Z'),
      expiresAt: null,
      hasValidityConflict: false,
      headlineEn: 'No active heavy-rainfall alert for Chattogram division',
      headlineBn: 'চট্টগ্রাম বিভাগের জন্য কোনো সক্রিয় ভারী বৃষ্টিপাত সতর্কতা নেই',
      descriptionEn:
        'As of 9 October 2026 00:00 UTC, BMD has no active heavy-rainfall alert for Chattogram. Absence of an alert does NOT establish safety — local conditions and antecedent rainfall must still be considered.',
      descriptionBn:
        '৯ অক্টোবর ২০২৬, ০০:০০ UTC অনুযায়ী চট্টগ্রামের জন্য কোনো সক্রিয় ভারী বৃষ্টিপাত সতর্কতা নেই। সতর্কতার অভাব নিরাপত্তা নিশ্চিত করে না — স্থানীয় অবস্থা ও পূর্ববর্তী বৃষ্টিপাত বিবেচনা করতে হবে।',
      areaDesc: 'Chattogram division',
      geometryJson: null,
      referencesJson: '[]',
    },
  })
  console.log('Seeded 2 BMD bulletins (July 5 validity conflict + October no-active)')

  // ---------- Jobs ----------
  await db.job.create({
    data: {
      jobKey: 'refresh_weather_2026-10-09T03',
      jobType: 'refresh_weather',
      state: 'completed',
      payloadJson: JSON.stringify({ sites: [chashma.id, salimpur.id, nagin.id] }),
      attempts: 1,
      leaseOwner: 'gha:refresh_weather',
      lastHeartbeat: new Date('2026-10-09T03:30:00Z'),
    },
  })
  await db.job.create({
    data: {
      jobKey: 'discover_bmd_2026-10-09T03',
      jobType: 'discover_bmd',
      state: 'completed',
      payloadJson: JSON.stringify({ feed: 'cap.bmd.gov.bd/api/cap/rss.xml' }),
      attempts: 1,
      leaseOwner: 'gha:discover_bmd',
      lastHeartbeat: new Date('2026-10-09T03:15:00Z'),
    },
  })
  await db.job.create({
    data: {
      jobKey: 'ee_export_2026-10-09T03',
      jobType: 'ee_export',
      state: 'failed',
      payloadJson: JSON.stringify({ site: 'chashma-hill', since: '2026-10-08' }),
      attempts: 3,
      maxAttempts: 3,
      error: 'Service account credential not configured — falling back to last historical replay asset (2026-07-09).',
      leaseOwner: null,
    },
  })
  await db.job.create({
    data: {
      jobKey: 'render_pdf_NAGIN_v1',
      jobType: 'render_pdf',
      state: 'completed',
      payloadJson: JSON.stringify({ caseId: naginCase.id, version: 1 }),
      attempts: 1,
      leaseOwner: 'gha:render_pdf',
      lastHeartbeat: new Date('2026-06-27T10:00:00Z'),
    },
  })
  await db.job.create({
    data: {
      jobKey: 'imerg_parse_2026-10-09T02',
      jobType: 'imerg_parse',
      state: 'running',
      payloadJson: JSON.stringify({ site: 'chashma-hill', since: '2026-07-07T18:00:00Z' }),
      attempts: 1,
      leaseOwner: 'gha:imerg_parse',
      leaseExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      lastHeartbeat: new Date(Date.now() - 2 * 60 * 1000),
    },
  })
  console.log('Seeded 5 jobs')

  // ---------- Notifications ----------
  await db.notification.create({
    data: {
      userId: users[1].id,
      dedupKey: 'bmd_july5_conflict',
      category: 'bmd',
      titleEn: 'BMD alert has validity conflict',
      titleBn: 'BMD সতর্কতায় বৈধতার অমিল আছে',
      bodyEn: '5 July CAP XML expires after 24h but text describes 72h. Human review required.',
      bodyBn: '৫ জুলাই CAP XML ২৪ ঘণ্টায় মেয়াদোত্তীর্ণ কিন্তু টেক্সট ৭২ ঘণ্টা উল্লেখ করে। মানব পর্যালোচনা প্রয়োজন।',
      severity: 'warning',
    },
  })
  await db.notification.create({
    data: {
      userId: users[1].id,
      dedupKey: 'ee_export_failed_2026-10-09',
      category: 'source',
      titleEn: 'Earth Engine export failed',
      titleBn: 'Earth Engine এক্সপোর্ট ব্যর্থ',
      bodyEn: 'EE service account not configured. System has fallen back to last historical replay asset (2026-07-09).',
      bodyBn: 'EE সার্ভিস অ্যাকাউন্ট কনফিগার করা নেই। সর্বশেষ historical replay অ্যাসেটে ফিরে গেছে (২০২৬-০৭-০৯)।',
      severity: 'error',
    },
  })
  await db.notification.create({
    data: {
      userId: users[2].id,
      dedupKey: 'nagin_field_corroborated',
      category: 'case',
      titleEn: 'Nagin Hill case field-corroborated',
      titleBn: 'নাগিন পাহাড় কেস ফিল্ড-করোবোরেটেড',
      bodyEn: 'Case NAGIN-2026-06-18 has been field-corroborated and reviewed. Report v1 archived.',
      bodyBn: 'কেস NAGIN-2026-06-18 ফিল্ড-করোবোরেটেড ও পর্যালোচিত। রিপোর্ট v1 আর্কাইভ করা হয়েছে।',
      severity: 'success',
    },
  })
  await db.notification.create({
    data: {
      userId: users[3].id,
      dedupKey: 'prep_no_active_alert',
      category: 'bmd',
      titleEn: 'No active BMD alert for Chattogram',
      titleBn: 'চট্টগ্রামের জন্য কোনো সক্রিয় BMD সতর্কতা নেই',
      bodyEn: 'As of 9 Oct 2026, no heavy-rainfall alert is active. Continue routine preparedness.',
      bodyBn: '৯ অক্টোবর ২০২৬ অনুযায়ী কোনো ভারী বৃষ্টিপাত সতর্কতা সক্রিয় নেই। নিয়মিত প্রস্তুতি চালিয়ে যান।',
      severity: 'info',
    },
  })
  console.log('Seeded 4 notifications')

  // ---------- Audit logs ----------
  await db.auditLog.create({
    data: {
      actorId: users[1].id,
      action: 'seed_completed',
      target: 'database',
      detailJson: JSON.stringify({ users: users.length, sites: 3, cases: 3, weather: 72 }),
    },
  })

  console.log('\n✅ Seed complete. Demo accounts:')
  console.log('   admin@paharpahara.bd / admin123')
  console.log('   reviewer@paharpahara.bd / reviewer123')
  console.log('   forest@paharpahara.bd / forest123')
  console.log('   preparedness@paharpahara.bd / prep123')
  console.log('   viewer@paharpahara.bd / viewer123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
