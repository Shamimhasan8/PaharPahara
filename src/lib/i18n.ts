// PaharPahara — bilingual i18n dictionary (EN/BN)
export type Lang = 'en' | 'bn'

export type Dict = {
  appName: string
  tagline: string
  login: { title: string; subtitle: string; email: string; password: string; submit: string; signingIn: string; invalid: string; demoAccounts: string; signOut: string; signedInAs: string }
  nav: {
    dashboard: string
    sites: string
    cases: string
    reports: string
    sources: string
    jobs: string
    notifications: string
    preparedness: string
    audit: string
  }
  common: {
    loading: string
    error: string
    retry: string
    save: string
    cancel: string
    close: string
    yes: string
    no: string
    search: string
    filter: string
    all: string
    none: string
    viewDetails: string
    back: string
    open: string
    download: string
    print: string
    request: string
    refresh: string
    requested: string
    ack: string
  }
  status: {
    live: string
    stale: string
    historicalReplay: string
    unavailable: string
    queued: string
    running: string
    completed: string
    failed: string
    retry: string
    candidate: string
    underReview: string
    fieldVerification: string
    reviewed: string
    rejected: string
    fieldCorroborated: string
    draft: string
  }
  dashboard: {
    title: string
    subtitle: string
    bmdBanner: string
    noActiveAlert: string
    siteStatus: string
    activeCases: string
    rainfall24h: string
    rainfall72h: string
    sourceHealth: string
    recentCases: string
    viewAll: string
    incompleteData: string
    asOf: string
    unknown: string
  }
  site: {
    title: string
    jurisdiction: string
    verifiedDoe: string
    verifiedForest: string
    unverified: string
    area: string
    elevation: string
    slope: string
    latitude: string
    longitude: string
    verificationSource: string
    recentCases: string
    rainfallSummary: string
    viewOnMap: string
  }
  case: {
    title: string
    caseKey: string
    site: string
    status: string
    detectedAt: string
    disturbanceType: string
    vegetationClearance: string
    construction: string
    landslideScar: string
    seasonal: string
    changedArea: string
    coverage: string
    uncertainty: string
    methodVersion: string
    screeningRule: string
    beforeAfter: string
    before: string
    after: string
    ndviDelta: string
    bareSoilDelta: string
    dwTreeProbDelta: string
    dwBareProbDelta: string
    reviewDecision: string
    rationale: string
    permitStatus: string
    nextAction: string
    submit: string
    submitWarning: string
    revisionHistory: string
    noHistory: string
    requestReport: string
    reportRequested: string
    revisionConflict: string
    reviewedBy: string
    noAssessment: string
    assets: string
    provenance: string
    sha256: string
    qaStatus: string
    coveragePct: string
    acquiredAt: string
    grid: string
    providerAssetId: string
    licence: string
    sourceFreshness: string
    rainWindow: string
    insufficentData: string
    monitor: string
    review: string
    priorityReview: string
  }
  report: {
    title: string
    list: string
    version: string
    status: string
    requestedAt: string
    caseKey: string
    view: string
    noReports: string
    openPrintable: string
    hash: string
    pinnedRevision: string
  }
  sources: {
    title: string
    subtitle: string
    adapter: string
    product: string
    version: string
    accessState: string
    lastChecked: string
    licence: string
    notes: string
  }
  jobs: {
    title: string
    subtitle: string
    jobKey: string
    jobType: string
    state: string
    attempts: string
    lease: string
    heartbeat: string
    error: string
    payload: string
    noJobs: string
  }
  notifications: {
    title: string
    markAllRead: string
    empty: string
    category: string
  }
  preparedness: {
    title: string
    subtitle: string
    bmdHeading: string
    rainfallHeading: string
    forecastHeading: string
    note: string
  }
  footer: {
    disclaimer: string
    version: string
    links: string
  }
}

export const dict: Record<Lang, Dict> = {
  en: {
    appName: 'PaharPahara',
    tagline: 'Hill disturbance & weather preparedness — Chattogram',
    login: {
      title: 'Sign in to PaharPahara',
      subtitle: 'Evidence-led hill-disturbance screening for Chattogram, Bangladesh',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      signingIn: 'Signing in…',
      invalid: 'Invalid email or password. Try a demo account below.',
      demoAccounts: 'Demo accounts',
      signOut: 'Sign out',
      signedInAs: 'Signed in as',
    },
    nav: {
      dashboard: 'Dashboard',
      sites: 'Sites',
      cases: 'Cases',
      reports: 'Reports',
      sources: 'Source Health',
      jobs: 'Jobs',
      notifications: 'Notifications',
      preparedness: 'Preparedness',
      audit: 'Audit Log',
    },
    common: {
      loading: 'Loading…',
      error: 'Something went wrong',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      none: 'None',
      viewDetails: 'View details',
      back: 'Back',
      open: 'Open',
      download: 'Download',
      print: 'Print',
      request: 'Request',
      refresh: 'Refresh',
      requested: 'Requested',
      ack: 'Acknowledge',
    },
    status: {
      live: 'Live',
      stale: 'Stale',
      historicalReplay: 'Historical replay',
      unavailable: 'Unavailable',
      queued: 'Queued',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      retry: 'Retry',
      candidate: 'Candidate',
      underReview: 'Under review',
      fieldVerification: 'Field verification',
      reviewed: 'Reviewed',
      rejected: 'Rejected',
      fieldCorroborated: 'Field corroborated',
      draft: 'Draft',
    },
    dashboard: {
      title: 'Operations Dashboard',
      subtitle: 'Real-time evidence queue and weather conditions across monitored hills',
      bmdBanner: 'BMD Active Alert',
      noActiveAlert: 'No active BMD alert',
      siteStatus: 'Site Status',
      activeCases: 'Active Cases',
      rainfall24h: 'Rainfall 24h',
      rainfall72h: 'Rainfall 72h',
      sourceHealth: 'Source Health',
      recentCases: 'Recent Cases',
      viewAll: 'View all',
      incompleteData: 'Incomplete',
      asOf: 'as of',
      unknown: 'Unknown',
    },
    site: {
      title: 'Monitored Sites',
      jurisdiction: 'Jurisdiction',
      verifiedDoe: 'DoE — verified',
      verifiedForest: 'Forest Dept — verified',
      unverified: 'Unverified',
      area: 'Area',
      elevation: 'Elevation',
      slope: 'Max slope',
      latitude: 'Latitude',
      longitude: 'Longitude',
      verificationSource: 'Verification source',
      recentCases: 'Cases at this site',
      rainfallSummary: 'Rainfall summary',
      viewOnMap: 'View on map',
    },
    case: {
      title: 'Case Review Queue',
      caseKey: 'Case key',
      site: 'Site',
      status: 'Status',
      detectedAt: 'Detected at',
      disturbanceType: 'Disturbance type',
      vegetationClearance: 'Vegetation clearance',
      construction: 'Construction',
      landslideScar: 'Landslide scar',
      seasonal: 'Seasonal effect',
      changedArea: 'Changed area',
      coverage: 'Coverage',
      uncertainty: 'Uncertainty & limitations',
      methodVersion: 'Method',
      screeningRule: 'Screening rule',
      beforeAfter: 'Before / After',
      before: 'Before',
      after: 'After',
      ndviDelta: 'NDVI Δ',
      bareSoilDelta: 'Bare-soil Δ',
      dwTreeProbDelta: 'DW tree prob Δ',
      dwBareProbDelta: 'DW bare prob Δ',
      reviewDecision: 'Reviewer Decision',
      rationale: 'Rationale',
      permitStatus: 'Permit status',
      nextAction: 'Next action',
      submit: 'Submit decision',
      submitWarning: 'Only authorized reviewers can submit decisions.',
      revisionHistory: 'Revision history',
      noHistory: 'No history yet.',
      requestReport: 'Request report',
      reportRequested: 'Report queued',
      revisionConflict: 'Case was edited by another reviewer. Reload and try again.',
      reviewedBy: 'Reviewed by',
      noAssessment: 'No assessment yet.',
      assets: 'Source assets',
      provenance: 'Provenance',
      sha256: 'SHA-256',
      qaStatus: 'QA status',
      coveragePct: 'Coverage',
      acquiredAt: 'Acquired',
      grid: 'Grid',
      providerAssetId: 'Provider asset ID',
      licence: 'Licence',
      sourceFreshness: 'Source freshness',
      rainWindow: 'Rainfall window',
      insufficentData: 'Insufficient data',
      monitor: 'Monitor',
      review: 'Review',
      priorityReview: 'Priority review',
    },
    report: {
      title: 'Report Archive',
      list: 'Report versions',
      version: 'Version',
      status: 'Status',
      requestedAt: 'Requested at',
      caseKey: 'Case',
      view: 'View',
      noReports: 'No reports yet. Request one from a case review.',
      openPrintable: 'Open printable',
      hash: 'SHA-256',
      pinnedRevision: 'Pinned case revision',
    },
    sources: {
      title: 'Source Health',
      subtitle: 'Status of every provider adapter. A green status never implies a hill is safe.',
      adapter: 'Adapter',
      product: 'Product',
      version: 'Version',
      accessState: 'Access state',
      lastChecked: 'Last checked',
      licence: 'Licence',
      notes: 'Notes',
    },
    jobs: {
      title: 'Background Jobs',
      subtitle: 'Scheduled data collection and report-rendering queue',
      jobKey: 'Job key',
      jobType: 'Type',
      state: 'State',
      attempts: 'Attempts',
      lease: 'Lease owner',
      heartbeat: 'Heartbeat',
      error: 'Error',
      payload: 'Payload',
      noJobs: 'No jobs yet.',
    },
    notifications: {
      title: 'Notifications',
      markAllRead: 'Mark all read',
      empty: 'No notifications.',
      category: 'Category',
    },
    preparedness: {
      title: 'Preparedness View',
      subtitle: 'Rainfall, forecasts and BMD warnings for disaster-management staff',
      bmdHeading: 'BMD official warnings',
      rainfallHeading: 'Recent rainfall (completeness-aware)',
      forecastHeading: 'Forecast (next 24h)',
      note: 'Official evacuation and warning authority stays with BMD and the responsible agencies. This view is decision-support only.',
    },
    footer: {
      disclaimer: 'PaharPahara is a decision-support prototype. Satellite evidence alone cannot establish an offence. Official warning authority remains with BMD.',
      version: 'Prototype v0.1 — historical replay mode',
      links: 'Demo build • Not for operational use',
    },
  },
  bn: {
    appName: 'পাহাড়পাহাড়া',
    tagline: 'পাহাড় বিঘ্ন ও আবহাওয়া প্রস্তুতি — চট্টগ্রাম',
    login: {
      title: 'পাহাড়পাহাড়া-তে সাইন ইন করুন',
      subtitle: 'চট্টগ্রাম, বাংলাদেশের জন্য প্রমাণভিত্তিক পাহাড়-বিঘ্ন স্ক্রিনিং',
      email: 'ইমেইল',
      password: 'পাসওয়ার্ড',
      submit: 'সাইন ইন',
      signingIn: 'সাইন ইন হচ্ছে…',
      invalid: 'ভুল ইমেইল বা পাসওয়ার্ড। নিচের ডেমো অ্যাকাউন্ট ব্যবহার করুন।',
      demoAccounts: 'ডেমো অ্যাকাউন্ট',
      signOut: 'সাইন আউট',
      signedInAs: 'সাইন ইন করা আছে',
    },
    nav: {
      dashboard: 'ড্যাশবোর্ড',
      sites: 'সাইট',
      cases: 'কেস',
      reports: 'রিপোর্ট',
      sources: 'উৎস স্বাস্থ্য',
      jobs: 'জব',
      notifications: 'বিজ্ঞপ্তি',
      preparedness: 'প্রস্তুতি',
      audit: 'অডিট লগ',
    },
    common: {
      loading: 'লোড হচ্ছে…',
      error: 'কিছু সমস্যা হয়েছে',
      retry: 'আবার চেষ্টা করুন',
      save: 'সংরক্ষণ',
      cancel: 'বাতিল',
      close: 'বন্ধ',
      yes: 'হ্যাঁ',
      no: 'না',
      search: 'অনুসন্ধান',
      filter: 'ফিল্টার',
      all: 'সব',
      none: 'কিছু না',
      viewDetails: 'বিস্তারিত',
      back: 'পেছনে',
      open: 'খোলা',
      download: 'ডাউনলোড',
      print: 'প্রিন্ট',
      request: 'অনুরোধ',
      refresh: 'রিফ্রেশ',
      requested: 'অনুরোধকৃত',
      ack: 'স্বীকার',
    },
    status: {
      live: 'লাইভ',
      stale: 'পুরোনো',
      historicalReplay: 'ঐতিহাসিক রিপ্লে',
      unavailable: 'অনুপলব্ধ',
      queued: 'সারিবদ্ধ',
      running: 'চলমান',
      completed: 'সম্পন্ন',
      failed: 'ব্যর্থ',
      retry: 'পুনঃচেষ্টা',
      candidate: 'প্রার্থী',
      underReview: 'পর্যালোচনাধীন',
      fieldVerification: 'ফিল্ড যাচাই',
      reviewed: 'পর্যালোচিত',
      rejected: 'প্রত্যাখ্যাত',
      fieldCorroborated: 'ফিল্ড-করোবোরেটেড',
      draft: 'খসড়া',
    },
    dashboard: {
      title: 'অপারেশন ড্যাশবোর্ড',
      subtitle: 'পর্যবেক্ষিত পাহাড়গুলোর রিয়েল-টাইম প্রমাণ সারি ও আবহাওয়া অবস্থা',
      bmdBanner: 'BMD সক্রিয় সতর্কতা',
      noActiveAlert: 'কোনো সক্রিয় BMD সতর্কতা নেই',
      siteStatus: 'সাইট অবস্থা',
      activeCases: 'সক্রিয় কেস',
      rainfall24h: '২৪ঘা বৃষ্টিপাত',
      rainfall72h: '৭২ঘা বৃষ্টিপাত',
      sourceHealth: 'উৎস স্বাস্থ্য',
      recentCases: 'সাম্প্রতিক কেস',
      viewAll: 'সব দেখুন',
      incompleteData: 'অসম্পূর্ণ',
      asOf: 'হিসাবকাল',
      unknown: 'অজানা',
    },
    site: {
      title: 'পর্যবেক্ষিত সাইট',
      jurisdiction: 'এখতিয়ার',
      verifiedDoe: 'DoE — যাচাইকৃত',
      verifiedForest: 'Forest Dept — যাচাইকৃত',
      unverified: 'অযাচাইকৃত',
      area: 'এলাকা',
      elevation: 'উচ্চতা',
      slope: 'সর্বোচ্চ ঢাল',
      latitude: 'অক্ষাংশ',
      longitude: 'দ্রাঘিমাংশ',
      verificationSource: 'যাচাই উৎস',
      recentCases: 'এই সাইটের কেস',
      rainfallSummary: 'বৃষ্টিপাত সারাংশ',
      viewOnMap: 'মানচিত্রে দেখুন',
    },
    case: {
      title: 'কেস পর্যালোচনা সারি',
      caseKey: 'কেস কী',
      site: 'সাইট',
      status: 'অবস্থা',
      detectedAt: 'সনাক্তকরণ সময়',
      disturbanceType: 'বিঘ্নের ধরন',
      vegetationClearance: 'উদ্ভিদ পরিষ্কার',
      construction: 'নির্মাণ',
      landslideScar: 'ভূমিধস দাগ',
      seasonal: 'মৌসুমী প্রভাব',
      changedArea: 'পরিবর্তিত এলাকা',
      coverage: 'কভারেজ',
      uncertainty: 'অনিশ্চয়তা ও সীমাবদ্ধতা',
      methodVersion: 'পদ্ধতি',
      screeningRule: 'স্ক্রিনিং নিয়ম',
      beforeAfter: 'পূর্বে / পরে',
      before: 'পূর্বে',
      after: 'পরে',
      ndviDelta: 'NDVI Δ',
      bareSoilDelta: 'খালি মাটি Δ',
      dwTreeProbDelta: 'DW গাছ সম্ভাবনা Δ',
      dwBareProbDelta: 'DW খালি সম্ভাবনা Δ',
      reviewDecision: 'পর্যালোচক সিদ্ধান্ত',
      rationale: 'যৌক্তিকতা',
      permitStatus: 'অনুমতি অবস্থা',
      nextAction: 'পরবর্তী পদক্ষেপ',
      submit: 'সিদ্ধান্ত জমা দিন',
      submitWarning: 'শুধুমাত্র অনুমোদিত পর্যালোচক সিদ্ধান্ত জমা দিতে পারেন।',
      revisionHistory: 'রিভিশন ইতিহাস',
      noHistory: 'এখনো কোনো ইতিহাস নেই।',
      requestReport: 'রিপোর্ট অনুরোধ',
      reportRequested: 'রিপোর্ট সারিবদ্ধ',
      revisionConflict: 'অন্য পর্যালোচক কেস সম্পাদনা করেছেন। রিলোড করে আবার চেষ্টা করুন।',
      reviewedBy: 'পর্যালোচক',
      noAssessment: 'এখনো কোনো মূল্যায়ন নেই।',
      assets: 'উৎস অ্যাসেট',
      provenance: 'উৎস প্রমাণ',
      sha256: 'SHA-256',
      qaStatus: 'QA অবস্থা',
      coveragePct: 'কভারেজ',
      acquiredAt: 'অধিগ্রহণ',
      grid: 'গ্রিড',
      providerAssetId: 'প্রোভাইডার অ্যাসেট ID',
      licence: 'লাইসেন্স',
      sourceFreshness: 'উৎস সতেজতা',
      rainWindow: 'বৃষ্টিপাত উইন্ডো',
      insufficentData: 'অপর্যাপ্ত তথ্য',
      monitor: 'মনিটর',
      review: 'পর্যালোচনা',
      priorityReview: 'অগ্রাধিকার পর্যালোচনা',
    },
    report: {
      title: 'রিপোর্ট আর্কাইভ',
      list: 'রিপোর্ট সংস্করণ',
      version: 'সংস্করণ',
      status: 'অবস্থা',
      requestedAt: 'অনুরোধ সময়',
      caseKey: 'কেস',
      view: 'দেখুন',
      noReports: 'কোনো রিপোর্ট নেই। একটি কেস পর্যালোচনা থেকে অনুরোধ করুন।',
      openPrintable: 'প্রিন্টযোগ্য খুলুন',
      hash: 'SHA-256',
      pinnedRevision: 'পিন করা কেস রিভিশন',
    },
    sources: {
      title: 'উৎস স্বাস্থ্য',
      subtitle: 'প্রতিটি প্রোভাইডার অ্যাডাপ্টারের অবস্থা। সবুজ অবস্থা কখনো পাহাড়ের নিরাপত্তা নিশ্চিত করে না।',
      adapter: 'অ্যাডাপ্টার',
      product: 'প্রোডাক্ট',
      version: 'সংস্করণ',
      accessState: 'অ্যাক্সেস অবস্থা',
      lastChecked: 'সর্বশেষ যাচাই',
      licence: 'লাইসেন্স',
      notes: 'নোট',
    },
    jobs: {
      title: 'ব্যাকগ্রাউন্ড জব',
      subtitle: 'নির্ধারিত ডেটা সংগ্রহ ও রিপোর্ট-রেন্ডারিং সারি',
      jobKey: 'জব কী',
      jobType: 'ধরন',
      state: 'অবস্থা',
      attempts: 'প্রচেষ্টা',
      lease: 'লিজ মালিক',
      heartbeat: 'হার্টবিট',
      error: 'ত্রুটি',
      payload: 'পেলোড',
      noJobs: 'কোনো জব নেই।',
    },
    notifications: {
      title: 'বিজ্ঞপ্তি',
      markAllRead: 'সব পঠিত চিহ্নিত করুন',
      empty: 'কোনো বিজ্ঞপ্তি নেই।',
      category: 'বিভাগ',
    },
    preparedness: {
      title: 'প্রস্তুতি ভিউ',
      subtitle: 'দুর্যোগ ব্যবস্থাপনা কর্মীদের জন্য বৃষ্টিপাত, পূর্বাভাস ও BMD সতর্কতা',
      bmdHeading: 'BMD অফিসিয়াল সতর্কতা',
      rainfallHeading: 'সাম্প্রতিক বৃষ্টিপাত (সম্পূর্ণতা-সচেতন)',
      forecastHeading: 'পূর্বাভাস (পরবর্তী ২৪ঘা)',
      note: 'অফিসিয়াল সরিয়ে নেওয়া ও সতর্কতা কর্তৃপক্ষ BMD এবং দায়িত্বশীল সংস্থার হাতে। এই ভিউ শুধু সিদ্ধান্ত-সহায়তা।',
    },
    footer: {
      disclaimer: 'পাহাড়পাহাড়া একটি সিদ্ধান্ত-সহায়ক প্রোটোটাইপ। স্যাটেলাইট প্রমাণ একা কোনো অপরাধ প্রমাণ করতে পারে না। অফিসিয়াল সতর্কতা কর্তৃপক্ষ BMD-এর কাছেই থাকে।',
      version: 'প্রোটোটাইপ v0.1 — ঐতিহাসিক রিপ্লে মোড',
      links: 'ডেমো বিল্ড • অপারেশনাল ব্যবহারের জন্য নয়',
    },
  },
}
