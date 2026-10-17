// PaharPahara — Risk Zone seed script
// Seeds Red/Yellow/Green risk zones for Chattogram with realistic geographical boundaries.
// Run with: bun run scripts/seed-risk-zones.ts

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Helper: create a GeoJSON polygon from center + radius (in degrees)
function circlePolygon(cx: number, cy: number, radiusDeg: number, points = 32): string {
  const coords: number[][] = []
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    coords.push([cx + Math.cos(angle) * radiusDeg, cy + Math.sin(angle) * radiusDeg])
  }
  return JSON.stringify({ type: 'Polygon', coordinates: [coords] })
}

async function main() {
  console.log('Seeding risk zones...')

  const sites = await db.site.findMany()
  const chashma = sites.find((s) => s.slug === 'chashma-hill')
  const salimpur = sites.find((s) => s.slug === 'jangal-salimpur')
  const nagin = sites.find((s) => s.slug === 'nagin-hill')

  // Update site risk levels based on factors
  if (chashma) {
    await db.site.update({
      where: { id: chashma.id },
      data: {
        riskLevel: 'red',
        riskScore: 82,
        riskReasonsJson: JSON.stringify([
          'Slope >40° — high landslide probability',
          '53.6mm rainfall in 24h — approaching YPSA 100mm trigger',
          'Active vegetation clearance detected (1.34 ha)',
          'BMD heavy rainfall alert active with validity conflict',
          'Density of settlements at hill base',
        ]),
      },
    })
  }
  if (salimpur) {
    await db.site.update({
      where: { id: salimpur.id },
      data: {
        riskLevel: 'yellow',
        riskScore: 45,
        riskReasonsJson: JSON.stringify([
          'Moderate slope (35°)',
          'Low rainfall in 24h',
          'Seasonal disturbance candidate (not confirmed cutting)',
          'No active BMD alert for this specific area',
        ]),
      },
    })
  }
  if (nagin) {
    await db.site.update({
      where: { id: nagin.id },
      data: {
        riskLevel: 'yellow',
        riskScore: 38,
        riskReasonsJson: JSON.stringify([
          'Steep slope (48°) but Forest Dept jurisdiction verified',
          'Previously reviewed and field-corroborated',
          'No current active disturbance',
          'Rainfall levels moderate',
        ]),
      },
    })
  }

  // Delete existing risk zones
  await db.riskZone.deleteMany({})

  // ---- RED ZONES (High Risk) ----
  const redZones = [
    {
      siteId: chashma?.id,
      nameEn: 'Chashma Hill — South Face (High Risk)',
      nameBn: 'চাষ্মা পাহাড় — দক্ষিণ ঢাল (উচ্চ ঝুঁকি)',
      geometryJson: circlePolygon(91.8198, 22.3590, 0.005),
      level: 'red',
      areaHectares: 4.2,
      reasonEn: 'Active vegetation clearance detected. Slope >40°. 53.6mm rain in 24h. BMD alert active. Settlements at base.',
      reasonBn: 'সক্রিয় উদ্ভিদ পরিষ্কার সনাক্ত। ঢাল >৪০°। ২৪ঘায় ৫৩.৬মিমি বৃষ্টি। BMD সতর্কতা সক্রিয়। পাদদেশে বসতি।',
      factorsJson: JSON.stringify({ slope: 42, rainfall24h: 53.6, rainfall72h: 89.2, disturbance: 'active', bmdAlert: true, population: 1200 }),
      populationEstimate: 1200,
    },
    {
      siteId: chashma?.id,
      nameEn: 'Chashma Hill — East Slope (High Risk)',
      nameBn: 'চাষ্মা পাহাড় — পূর্ব ঢাল (উচ্চ ঝুঁকি)',
      geometryJson: circlePolygon(91.8225, 22.3615, 0.004),
      level: 'red',
      areaHectares: 3.1,
      reasonEn: 'Steep slope with recent disturbance signs. High rainfall. Dense settlement proximity.',
      reasonBn: 'খাড়া ঢাল সাম্প্রতিক বিঘ্নের লক্ষণ সহ। উচ্চ বৃষ্টিপাত। ঘনবসতির নিকটবর্তী।',
      factorsJson: JSON.stringify({ slope: 38, rainfall24h: 53.6, rainfall72h: 89.2, disturbance: 'recent', bmdAlert: true, population: 800 }),
      populationEstimate: 800,
    },
    {
      siteId: null,
      nameEn: 'Bayezid Bostami Road Area (High Risk)',
      nameBn: 'বায়েজিদ বোস্তামী রোড এলাকা (উচ্চ ঝুঁকি)',
      geometryJson: circlePolygon(91.8103, 22.4278, 0.006),
      level: 'red',
      areaHectares: 5.5,
      reasonEn: 'Historical landslide incidents. Hill cutting reported. Dense unplanned settlements on hill slopes.',
      reasonBn: 'ঐতিহাসিক ভূমিধস ঘটনা। পাহাড় কাটা রিপোর্ট। পাহাড়ের ঢালে ঘন অপরিকল্পিত বসতি।',
      factorsJson: JSON.stringify({ slope: 45, rainfall24h: 48.0, rainfall72h: 75.0, disturbance: 'historical', bmdAlert: true, population: 2500 }),
      populationEstimate: 2500,
    },
  ]

  // ---- YELLOW ZONES (Moderate Risk) ----
  const yellowZones = [
    {
      siteId: salimpur?.id,
      nameEn: 'Jangal Salimpur — Central Area (Moderate Risk)',
      nameBn: 'জঙ্গল সালিমপুর — কেন্দ্রীয় এলাকা (মাঝারি ঝুঁকি)',
      geometryJson: circlePolygon(91.8716, 22.3039, 0.005),
      level: 'yellow',
      areaHectares: 8.7,
      reasonEn: 'Moderate slope. Seasonal disturbance candidate. Monitoring required. No active BMD alert for this area.',
      reasonBn: 'মাঝারি ঢাল। মৌসুমী বিঘ্ন প্রার্থী। নজরদারি প্রয়োজন। এই এলাকার জন্য কোনো সক্রিয় BMD সতর্কতা নেই।',
      factorsJson: JSON.stringify({ slope: 35, rainfall24h: 12.0, rainfall72h: 28.0, disturbance: 'seasonal', bmdAlert: false, population: 300 }),
      populationEstimate: 300,
    },
    {
      siteId: nagin?.id,
      nameEn: 'Nagin Hill — Monitored Area (Moderate Risk)',
      nameBn: 'নাগিন পাহাড় — পর্যবেক্ষিত এলাকা (মাঝারি ঝুঁকি)',
      geometryJson: circlePolygon(91.8103, 22.4278, 0.004),
      level: 'yellow',
      areaHectares: 4.5,
      reasonEn: 'Steep slope (48°) but Forest Dept verified. Previously reviewed and field-corroborated. No current active disturbance.',
      reasonBn: 'খাড়া ঢাল (৪৮°) কিন্তু Forest Dept যাচাইকৃত। পূর্বে পর্যালোচিত ও ফিল্ড-করোবোরেটেড। বর্তমানে কোনো সক্রিয় বিঘ্ন নেই।',
      factorsJson: JSON.stringify({ slope: 48, rainfall24h: 8.0, rainfall72h: 22.0, disturbance: 'none', bmdAlert: false, population: 150 }),
      populationEstimate: 150,
    },
    {
      siteId: null,
      nameEn: 'Pahartali Residential Area (Moderate Risk)',
      nameBn: 'পাহাড়তলী আবাসিক এলাকা (মাঝারি ঝুঁকি)',
      geometryJson: circlePolygon(91.7900, 22.3700, 0.007),
      level: 'yellow',
      areaHectares: 7.2,
      reasonEn: 'Residential area near hill base. Moderate slope exposure. Regular monitoring recommended.',
      reasonBn: 'পাহাড়ের পাদদেশে আবাসিক এলাকা। মাঝারি ঢাল ঝুঁকি। নিয়মিত নজরদারি প্রস্তাবিত।',
      factorsJson: JSON.stringify({ slope: 25, rainfall24h: 35.0, rainfall72h: 52.0, disturbance: 'none', bmdAlert: true, population: 1800 }),
      populationEstimate: 1800,
    },
  ]

  // ---- GREEN ZONES (Low Risk / Safe) ----
  const greenZones = [
    {
      siteId: null,
      nameEn: 'Chattogram City Center (Low Risk)',
      nameBn: 'চট্টগ্রাম শহর কেন্দ্র (নিম্ন ঝুঁকি)',
      geometryJson: circlePolygon(91.8315, 22.3275, 0.008),
      level: 'green',
      areaHectares: 15.0,
      reasonEn: 'Flat urban area. No hill exposure. No landslide history. Safe zone for evacuation assembly.',
      reasonBn: 'সমতল শহুরে এলাকা। কোনো পাহাড় ঝুঁকি নেই। কোনো ভূমিধস ইতিহাস নেই। সরিয়ে নেওয়ার জন্য নিরাপদ জোন।',
      factorsJson: JSON.stringify({ slope: 2, rainfall24h: 35.0, rainfall72h: 52.0, disturbance: 'none', bmdAlert: true, population: 50000 }),
      populationEstimate: 50000,
    },
    {
      siteId: null,
      nameEn: 'Patenga Sea Beach Area (Low Risk)',
      nameBn: 'পতেঙ্গা সমুদ্র সৈকত এলাকা (নিম্ন ঝুঁকি)',
      geometryJson: circlePolygon(91.7900, 22.2800, 0.006),
      level: 'green',
      areaHectares: 10.5,
      reasonEn: 'Coastal flat area. No hill or slope. Safe from landslide. Cyclone shelter available.',
      reasonBn: 'উপকূলীয় সমতল এলাকা। কোনো পাহাড় বা ঢাল নেই। ভূমিধস থেকে নিরাপদ। ঘূর্ণিঝড় আশ্রয় উপলব্ধ।',
      factorsJson: JSON.stringify({ slope: 1, rainfall24h: 20.0, rainfall72h: 35.0, disturbance: 'none', bmdAlert: false, population: 5000 }),
      populationEstimate: 5000,
    },
  ]

  // Insert all zones
  for (const zone of [...redZones, ...yellowZones, ...greenZones]) {
    await db.riskZone.create({ data: zone })
  }

  console.log(`Seeded ${redZones.length} red zones, ${yellowZones.length} yellow zones, ${greenZones.length} green zones`)
  console.log('✅ Risk zones seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
