# PaharPahara Prototype Building Plan

**Version 1.0 | Prepared 9 October 2026 | All delivery dates use Asia/Dhaka**  
**For mentor review by Jaz and implementation by the three-person team**  
**Round 2 target 14 October 2026 | Feature freeze 13 October | Finale 24 October, subject to qualification**

## 1 Purpose and final decision

We will build a cloud-hosted web application that turns suspected hill disturbance, rainfall estimates, forecasts and official warnings into an inspection queue and a traceable assessment report. The Department of Environment is the intended primary user. Forest officers receive relevant evidence where forest boundaries and jurisdiction are verified; disaster-management staff use the preparedness view.

The prototype must demonstrate the complete working loop: **collect source data, validate and store it, display the evidence, record a human decision, and generate a saved report**. A polished screen without these connections does not meet the build objective.

The final architecture is **a Lovable-assisted React and TypeScript application on Vercel, the team's own Supabase project for database/authentication/storage and thin backend functions, and Python cloud workers in GitHub Actions with Earth Engine**. Development takes place in browser-based Codespaces. The deployed system must operate after the developer's computer and Codespace are closed.

This document supersedes the earlier Technical Plan, Mentor 80/20 Plan and Cloud Build Plan for construction decisions. It incorporates the dossier and the supplied Round 2 audit, while recording unsupported or conflicting claims as verification tasks rather than implementation facts.

## 2 Prototype scope and users

Start with three documented sites: **Chashma Hill near Mayor Goli**, a small auditable **Jangal Salimpur study area**, and a third hill selected for usable imagery and boundary verification. Nagin Hill remains a candidate. Expand to five sites only after the complete loop passes. Keep evaluation locations separate from development sites.

Lead the demonstration with the **8 July 2026 Chashma Hill case**. BSS and other reporting corroborate two child deaths in separate Chattogram landslides that day; do not use victim names or photographs. A retrospective case shows what evidence existed and when, not that the prototype would necessarily have prevented the event. [R1]

Jangal Salimpur is an environmental study area, with jurisdiction marked unverified until authoritative records support it. Avoid assertions about residents, criminal activity or ownership. A real officer or volunteer is not required to operate the hackathon demo: provision reviewer test accounts and use archived evidence. Actual institutional adoption requires later agreement.

| User | Prototype capability | Boundary |
| --- | --- | --- |
| Reviewer or DoE officer | Inspect candidates, check permits, request field verification, approve reports | Satellite evidence alone cannot establish an offence |
| Forest officer | Review disturbance and verified forest overlap | No invented forest boundaries or summons |
| Preparedness staff | Review rainfall, forecasts and BMD warnings | Official evacuation and warning authority stays with the responsible agencies |
| Mentor or judge | Read sanitized examples and measured results | Demo access cannot edit operational records |
| Field contributor | Upload permissioned evidence to an assigned case | Field collection is useful, but not a Round 2 dependency |

**Included:** persistent login and roles, map and before/after view, source freshness, live forecast, rainfall ingestion, BMD discovery with import fallback, AI-derived land-cover evidence, case review, bilingual report, job monitoring, in-app notifications, historical replay and evaluation.

**After the core passes:** one live ensemble product; a small locally trained classifier if labels permit; grounded language-model summaries if permitted and funded. These experiments have explicit fallback paths below.

**Finale or research extensions:** voice delivery, radar corroboration, AlphaEarth features, LHASA and DIST-ALERT comparisons, calibrated landslide prediction, offline field synchronization and higher-resolution exposure/drainage data. They remain in the roadmap without blocking submission.

## 3 Frozen cloud architecture

| Component | Choice | Responsibility |
| --- | --- | --- |
| Application development | Lovable UI generation and GitHub sync; Codespaces for reviewed code edits | Reproducible, cloud-only development |
| Web runtime | React, TypeScript, TanStack Start, Tailwind and MapLibre on Vercel | Pages, map, charts, print view and authentication flow |
| Application services | Supabase Auth, Data API, restricted database functions and thin TypeScript Edge Functions | Authorization, provider fetches, job dispatch and workflow |
| Database | Team-owned Supabase PostgreSQL with PostGIS | Spatial sites/cases, weather intervals, decisions and audit history |
| File storage | Private Supabase Storage buckets | Source snapshots, small raster chips, manifests and report versions |
| Heavy processing | Python 3.12 in GitHub Actions; Earth Engine Python API | Rainfall parsing, image processing, exports, evaluation and archived PDFs |
| Scheduling | Supabase Cron and pg_net, plus an off-peak Actions backup schedule | Create due jobs, dispatch workers and monitor heartbeats |

Current Lovable documentation says new projects use **TanStack Start**, while older projects use React/Vite. For a new build, use the current starter and its documented Nitro/Vercel deployment path; inspect the generated package and lockfile before the first deployment. Do not apply an old static `dist/` deployment recipe to an app with server output. [R2–R3]

Create the Supabase project in the team's account **before** connecting Lovable. Select that external project on a fresh Lovable project and leave the built-in Lovable Cloud backend unused. This gives the team direct backend administration and worker credentials. The audit's absolute claim that every external worker is inherently locked out of Lovable Cloud is not adopted; the verified reason is ownership and avoiding a later migration. [R4]

Supabase provides a managed SQL database, not the weather dataset. We still need small reviewed SQL migrations, constraints and access policies, but no database server on a personal computer. Use one backend and one jobs table; retire FastAPI, Docker Compose and Next.js-specific API instructions from the earlier plans.

### Data flow

Supabase Cron creates due jobs and invokes thin dispatch/fetch functions. Workers and provider adapters validate inputs and write versioned records/files. The Vercel app reads permitted Supabase data. A reviewer records a decision, then requests a report job. The cloud worker creates an immutable PDF and the app retrieves an authorized download link.

For the architecture submission, draw these connections explicitly: source adapters to jobs; jobs to database/storage; database to map/review; review to report job; BMD warnings to both the site and preparedness views. The enforcement case and preparedness decision remain separate records.

## 4 Sources and exact collection contracts

### Satellite and terrain

Use Earth Engine collections `COPERNICUS/S2_SR_HARMONIZED`, `GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED`, `GOOGLE/DYNAMICWORLD/V1` and `COPERNICUS/DEM/GLO30_2024_1`. Initialize the Python API against one registered Earth Engine project, filter by verified site geometry and dates, and retain image/task identifiers. Check new imagery daily and process only new usable scenes. Load terrain once and retain its vintage. [R5–R8]

Cloud Score+ replaces reliance on QA60 for historical pairs. Join corresponding assets; use `cs_cdf >= 0.60` as an initial development setting, then tune and freeze it. An absent quality asset is a missing input, not permission to keep every pixel. Dynamic World contributes tree/bare/built probabilities; it is derived from Sentinel-2 and is **corroborating evidence, not an independent sensor**.

Mosaic the DEM's `DEM` band and set a suitable native/default projection before slope calculation. Preserve the approximately 30 m surface-model limitation. It cannot measure a new excavation's volume or current cliff geometry. RGB/NDVI bands can support 10 m products; indices using 20 m bands retain that effective limitation even when displayed on a finer grid.

### Rainfall estimates

Primary live source: **NASA IMERG Early V07**, short name `GPM_3IMERGHHE`. Resolve the collection through NASA CMR by short name/version rather than hard-coding the observed collection ID `C2723758340-GES_DISC`. Use authenticated Earthdata/`earthaccess` discovery and download; process only new granules and backfill gaps using a stored watermark. Check hourly initially, subject to measured worker quota. [R9]

Inspect file metadata, field name, dimensions, units and fill values before parsing. A half-hour rainfall rate in mm/hour contributes rate × 0.5 hours; an already accumulated product must not be multiplied again. Reject missing/fill values. NASA PPS GeoTIFF accumulations are an alternative adapter only after registration and verification of their scale and time windows; never silently interchange them with HDF5 rates.

IMERG's half-hour intervals are approximately 0.1 degrees, roughly 10 km, with nominal Early latency around four hours. Estimates are uncertain in mountainous terrain. Keep returned grid cells visible; two nearby hills may share weather. Temporarily download global inputs on cloud runners, then persist cropped analysis inputs and manifests rather than entire global archives.

Historical fallback/cross-check: Earth Engine `JAXA/GPM_L3/GSMaP/v8/operational`. Inspect its selected rainfall band and provisional status; retain source identity. It is not interchangeable with IMERG, and it is not an instantaneous local gauge. [R10]

### Forecasts and ensemble rainfall

Fetch Open-Meteo hourly from a backend adapter. A tested request is:

`https://api.open-meteo.com/v1/forecast?latitude=22.36&longitude=91.82&hourly=precipitation&forecast_days=3&timezone=UTC&models=gfs_seamless`

These coordinates demonstrate regional access, not a verified pilot hill. Store the raw response, requested and returned coordinates, units, fetch time and model/run information when supplied. Precipitation belongs to the **preceding hour**. Request UTC, construct interval start/end explicitly, and display Asia/Dhaka. Calculate next 6/24/48-hour totals separately from past rainfall. [R11]

Once the core works, integrate **one** documented ensemble family through Open-Meteo. Prefer WeatherNext 2 or ECMWF AIFS if permitted and available; otherwise select a documented conventional ensemble. Verify the exact model identifier and returned member count in a saved response. For each complete member, accumulate the same future 24-hour window; report members exceeding the configured rainfall threshold divided by valid members.

Show this as **uncalibrated rainfall exceedance probability**, never landslide probability. Do not pool hundreds of members from different models without a validated weighting method. Individual member archives cover only a short recent period; use observed/estimated historical rainfall and a supported Single Runs forecast for July replay, not today's ensemble or hindsight reanalysis. [R12–R13]

### BMD official warnings

Discover CAP documents hourly from **both** `https://cap.bmd.gov.bd/api/cap/rss.xml` and the public alert index, following the XML links actually published. Parse CAP 1.2 identifiers, sender, message type, references, sent/effective/onset/expires, text and affected geometry. Store updates/cancellations and deduplicate identifiers/revisions. Restrict manual import to permitted BMD URLs or reviewed uploads.

The 5 July alert XML retrieved for this plan has effective time **5 July 07:00 UTC** and expiry **6 July 07:00 UTC**, while its text describes 72 hours from 13:00 Bangladesh time on 5 July. Preserve both windows and show **validity conflict — human review required**. Do not silently extend the official XML expiry. A text-derived window is explicitly labeled and reviewed. CAP polygon pairs are latitude/longitude; convert to GeoJSON longitude/latitude and validate point-in-polygon matching. [R14]

The audit reported an RSS lastBuildDate of 17 August; direct retrieval for this plan returned **29 September 2026**. Keep dual discovery as a resilience measure, but do not claim the feed is currently stuck in August. BMD's lack of active alerts does not establish safety. Publisher instructions stay separate from our screening recommendations.

## 5 Evidence integrity and data freshness

Every stored input needs provider/product/version, asset ID, valid interval/acquisition dates, issue/run time if known, retrieval time, grid/geometry, units, QA status, file path and SHA-256. Record unknown timestamps as null with a reason.

Let D be the end of the latest contiguous valid received rainfall interval. Compute complete past 24/48/72-hour and five-day totals ending at D; display D prominently. A total with missing intervals is incomplete. Never fill missing rain with zero, add overlapping accumulations, or merge satellite estimates and forecasts without an explicit validated method. For half-hour inputs, complete windows require the expected 48/96/144/240 intervals.

Proposed engineering freshness policies: forecast stale after two hours, no new automatic forecast suggestions after six; rainfall delayed when D is over six hours old; optical evidence stale after 14 days; BMD status unknown after two missed hourly checks. These are configurable service policies, not hazard thresholds. Keep official warnings visible even when other feeds fail.

Use fixed raster alignment, nodata handling and documented resampling. Exchange geometry uses WGS84; Chattogram-area measurement uses an appropriate projected CRS such as EPSG:32646 after checking the final extent. Web Mercator is display-only. Preserve contributing dates in composites and export bytes rather than relying on expiring image tiles.

Every source has an access state: **live, stale, historical replay or unavailable**. A service-health indicator never implies a hill is safe. UI real-time subscriptions update saved records; they do not make satellite acquisition or rainfall publication instantaneous.

## 6 Analysis and visible AI

### CutWatch disturbance pipeline

1. Select comparable short before/after windows or same-season comparisons. Reject badly registered pairs and large seasonal mismatches.
2. Apply cloud/shadow QA and require sufficient **common** valid coverage. Start development with 60% coverage, then tune on development locations.
3. Compute NDVI and documented bare-soil-index change; add Dynamic World probability changes where corresponding data exist.
4. Restrict interpretation to verified hill areas; show DEM slope/relief as context. Address terrain illumination and shadow effects.
5. Group candidate pixels into polygons. An initial 0.1 ha filter is a tunable heuristic, not a proven detection limit; measure misses below that size.
6. Store suspected disturbance with date interval, approximate area, source IDs, valid coverage, method version and uncertainty. Distinguish vegetation clearance, construction, seasonal effects and landslide scars during review.

Freeze all thresholds before held-out testing. If Dynamic World is missing, label the result as the spectral baseline rather than claiming AI corroboration. The pretrained land-cover and cloud-quality products make AI visible without requiring a large local training run.

### Weather screening and SlopeRisk

| Suggested state | Prototype rule | Human action |
| --- | --- | --- |
| Insufficient data | Required imagery/weather quality fails | Inspect source gaps; keep applicable BMD information visible |
| Monitor | No current configured review trigger, with adequate inputs | Continue collection; this is not a safety declaration |
| Review | Suspected disturbance, applicable warning, or documented rainfall comparison crossed | Review evidence and request field checks |
| Priority review suggested | Reviewed configurable rule identifies elevated attention | Authorized reviewer confirms or rejects, with reasons |

Keep an independent BMD banner in every state. A rainfall crossing does not establish cutting; a suspected cut does not become a legal conclusion or automatically reduce a rainfall threshold.

Use YPSA's published **100–120 mm/24-hour** trigger as a sourced research comparison, with its local validation context. BMD's heavy/very-heavy terminology describes rainfall categories, not site-level landslide probability. Station thresholds do not transfer automatically to a 10 km satellite cell. Obtain gauge data and expert review before operational calibration. [R14–R15]

The audit also proposes GSB's 100 mm/3-hour, 200 mm/24-hour and 350 mm/72-hour values, Ahmed et al.'s five-day bands and older 24/48-hour rules. Preserve them in the comparison register, verify their primary definitions and endpoints, then enable them individually. Do not make an unverified combination the production rule. [R16]

### Measured model and summaries

Target 20–40 reviewed disturbance examples and 20–40 difficult negatives, grouped by hill/event. If suitable labels exist by 11 October, compare a small Random Forest or gradient-boosted disturbance classifier with the baseline. It replaces the baseline only after a useful held-out comparison; no pixel from the same event may leak across splits.

Always provide deterministic English and reviewed Bangla summaries. An optional LLM may draft from the stored fact JSON only, with sentence-to-field references, numeric/entity validation and reviewer approval. Provider failure or unsupported output falls back to templates. No external AI API is assumed permitted or free.

Future calibrated landslide modeling requires a defined site/horizon, adequate timed events, representative non-events, spatial/time splits and separate calibration. A three-hour refresh is not a three-hour prediction horizon. Prithvi's optical-band compatibility, Landslide4Sense's label/task mismatch and TerraTorch/checkpoint versions require a separate research gate; radar cannot simply occupy optical input channels.

## 7 Data model and application contracts

| Record group | Required contents |
| --- | --- |
| profiles and sites | Admin-assigned role; verified geometry/version; jurisdiction and verification source |
| source_registry and raw_assets | Adapter/version/licence; provider IDs, times, QA, file hash/path |
| weather_intervals and bulletins | Separate estimates/forecasts; intervals/grid/run; CAP references, geometry and both validity windows |
| cases and assessments | Disturbance geometry, before/after assets, method; feature cutoff/completeness and screening rule version |
| reviews and report_versions | Reviewer, decision/rationale, case revision; frozen fact snapshot and PDF hashes |
| jobs and notifications | Job key/type, state, lease, attempts, task IDs/heartbeat; in-app message and deduplication key |

Use foreign keys, spatial/time indexes and unique provider keys. Apply schema migrations from `supabase/migrations/`; regenerate TypeScript types. Store rasters in private buckets, not database rows.

Read permitted records with the Supabase SDK under row-level security. Sensitive case transitions use a validated database function or Edge Function that checks the user's JWT and role. Restrict callable database functions, fix their search path when using elevated privileges, and validate geometry/payload limits. Users cannot change their own roles.

Implement thin functions named `refresh-weather`, `discover-bmd`, `dispatch-job`, `review-case`, `request-report`, `get-download` and `source-health`. Move large CAP geometry parsing/normalization to Python jobs; discovery functions only fetch bounded payloads or queue work. Scheduler calls use a separate protected service route/credential; user-facing functions enforce authorization explicitly. New publishable API keys are not user identity. Allow only configured Vercel origins for cross-origin calls; keep worker secrets out of client bundles and public logs.

Cases move through **candidate, under review, rejected or field verification requested, reviewed, and optionally field corroborated**. Report jobs move through queued, running, completed or failed. Reviews append history and check the expected case revision so concurrent edits cannot silently overwrite a decision. Report creation pins that revision.

Build map/dashboard, site detail, case review, report archive, and source/job health views. Include search/filter, before/after slider, weather timeline, source links, warnings, terrain evidence and access states. Use our own exported Sentinel chips as imagery; verify any additional basemap licence rather than scraping commercial maps.

## 8 Report access and safe use

The report is **Hill disturbance and weather assessment**, marked draft, reviewed or field corroborated. Include case/site/polygon, image dates and QA, approximate changed area, terrain limits, rainfall windows/units/cutoff, forecast horizon, BMD source/status/conflicts, permit/jurisdiction status, reviewer/rationale, next action and input hashes.

Render print-ready HTML with a bundled Noto Sans Bengali font and tested Bangla conjuncts. Browser printing gives an immediate preview; a GitHub Actions worker uses a shaping-capable Chromium/Playwright renderer to archive the same frozen snapshot as a PDF. Do not generate heavyweight PDFs in Edge Functions. Store report/template versions; refreshing data cannot alter an old report.

A QR code opens the **authorized evidence snapshot**, not a public case dump. A hash helps detect changed bytes; it does not prove a source claim is true. Preserve lineage so a reviewer can recompute totals and inspect original evidence. Do not claim a legal digital signature or courtroom admissibility from an account approval alone.

Section 6B enforcement remains with authorized officials, including clearance/permit checks. Separate preparedness from enforcement and household targeting. Display decision-support status and preserve publisher wording without automatic downgrade. No public resident registry, automated summons, eviction instruction or operational voice broadcast is included. [R17]

The optional finale voice test uses only consented allowlisted numbers, an approved Bangla/Chittagonian test template, deduplication and provider status. Do not expose numbers in logs/reports. CAP export is a future interoperability artifact, not a claimed 1090 or government broadcast integration. Confirm applicable privacy obligations before introducing contacts; the audit's uncertain 2026 legal-status claim is not presented as verified law.

## 9 Step by step construction

### Step 1 Establish accounts and the deployment baseline

Create the owned Supabase project, enable PostGIS, connect Lovable, sync GitHub and deploy the starter on Vercel. Configure auth redirects/environment settings; commit the package lockfile and cloud development configuration. Register one eligible Earth Engine project and Earthdata credentials. Test one export, one rainfall parse and one saved forecast response.

**Exit:** Vercel URL, login and database read work; each provider's actual access status is recorded. Protect this integration gate before screen expansion.

### Step 2 Create schema and security

Apply migrations, Storage policies and role permissions. Provision reviewer/viewer/admin test accounts. Create verified site records and immutable source manifests. Separate sanitized judge examples from private records.

**Exit:** Records survive reload/another browser; anonymous writes, viewer reviews and cross-role file access fail as intended.

### Step 3 Deliver the historical case and first live stream

Assemble the July case from saved source data; show historical dates everywhere. Display a current live forecast alongside it in a separate clearly dated view. Ingest BMD CAP including the verified July validity conflict and updates. Build the map/slider/weather views against database records.

**Exit:** One real source case appears on the deployed map, with no invented image pair or rainfall chart.

### Step 4 Automate collection and processing

Create hourly weather/rainfall/BMD due jobs and daily imagery jobs. Supabase dispatches GitHub workflows; workers atomically claim leased jobs, preserve task IDs and resume exports. Add idempotency, backfill, bounded retries, off-peak backup schedules and heartbeat checks. A user analysis request returns a job ID immediately and polls status.

**Exit:** At least two scheduled runs persist fresh timestamps without duplicates, and a deliberate provider failure produces a visible recoverable state.

### Step 5 Connect analysis to review and bilingual reporting

Run the frozen disturbance pipeline; display transparent screening and independent official warnings. Implement append-only review and revision checks. Queue PDF generation, save the snapshot/PDF, and test authorization plus Bangla rendering. Add in-app notifications.

**Exit:** The deployed loop reaches a saved, downloadable report whose figures match its stored inputs.

### Step 6 Evaluate and add gated AI experiments

Measure held-out detections and replay outcomes. Add one ensemble family only after its intervals/member completeness pass. Attempt the small classifier and grounded summaries only within the remaining time/API/label budget. Benchmark layers are optional unless their archived coverage is confirmed.

**Exit:** An evaluation table states achieved results, sample counts and misses; experimental features have visible labels and fallback behavior.

### Step 7 Freeze and rehearse and submit

Run cloud CI and deployed end-to-end checks, restore a backup in a test environment, verify judge access, record the demo and freeze the release commit. Test a network-failure rehearsal with downloaded video/reports and sanitized replay assets. Submit through the confirmed channel and retain the receipt.

## 10 Dated milestones and three owners

| Dhaka date | Required gate | Lead |
| --- | --- | --- |
| 9 Oct evening | Stack/accounts, Vercel skeleton, source access tests, deadline queries | All owners |
| 10 Oct | July replay, live forecast, BMD discovery, persistent map and security | Data plus App |
| 11 Oct | Scheduled jobs, disturbance pipeline, review, bilingual report; rule review | App plus Data |
| 12 Oct | Held-out evaluation, integration/security checks, stakeholder feedback; gated ensemble | Validation plus Data |
| 13 Oct | Feature freeze, backup/restore check, release README, video and submission package | All owners |
| 14 Oct | Submit early at the confirmed hour; preserve receipt | Validation |
| 15–21 Oct | Mentor feedback and reliability; gated finale extensions | All owners |
| 22–23 Oct | Two timed rehearsals, one with network failure | All owners |
| 24 Oct | Verify cloud availability before presenting at AIUB | All owners |

**Data and Geospatial:** accounts/adapters, imagery/rainfall, manifests, analysis and dataset QA. **Application and Backend:** deployment, schema/RLS, UI, workflow/jobs and reports. **Validation Story and Stakeholders:** labels/evaluation, claims, expert/user feedback, pitch/video and submission. Record actual names and available hours with Jaz; do not invent assignments.

Ask the organizers/Jaz to confirm shortlist status, exact deadline hour/channel, required video length/access format, external AI rules and any Bangladesh Lovable-specific prize requirements. The official page confirms 14 October Round 2 and 24 October finale, up to three team members, Track 1 suitability, and a 5–10-minute finale presentation; no Bangladesh rubric weights or Lovable prize rule are assumed. Suggested contact is aicbdh4h2026@gmail.com. This plan prepares outreach; no messages have been sent. [R18]

If a provider remains blocked at the end of 10 October, move that stream to labeled historical replay. Keep the live forecast and working review/report loop. Cut optional models/voice/benchmark layers before cutting persistence, access control, source labels or report integrity. A failed mandatory gate is documented as incomplete, never presented as a completed live integration.

## 11 Evaluation and release acceptance

Group labels by location/event, tune only on development groups and hold out locations/time where possible. Historical replay admits only inputs demonstrably available by each simulated decision time. When publication time is unknown, disclose the assumption; later imagery cannot establish a pre-event warning.

Report true detections, false detections, missed disturbances, sample denominators, coverage gaps and a false-positive gallery. Precision/recall/F1 may accompany counts, but a small sample cannot substantiate broad accuracy claims. Use image QA and object-level matches; define spatial matching before evaluation. Weather evaluation distinguishes deterministic errors from ensemble reliability and requires independent gauge evidence for local calibration.

Compare rainfall-only screening with disturbance-aware screening as a hypothesis test. Measure evidence-assembly time on the same case manually and through the prototype, recording participants and case count. Do not promise the audit's illustrative three-minutes-versus-two-hours result. Seek feedback from YPSA/RIMES, the University of Chittagong geography team and DoE; request permission to quote. No partnership or endorsement is presumed.

**Release checks:** authenticated end-to-end loop; persisted multi-browser records; role and file isolation; duplicate-free refresh; source-failure behavior; expected unit/interval totals; correct CAP geometry/time/update/conflict handling; projected area and image coverage checks; report revision/hash consistency; Bangla visual inspection; job recovery; backup restore; secrets absent from client/logs; mobile usability; operation with Codespaces stopped.

Maintain `preflight.py` plus frontend/deployed checks. Pure unit fixtures do not prove credentials, scheduled execution or deployed authorization. Store CI results, manual QA screenshots, provider integration evidence and the release commit. No software test is claimed passed by this planning document.

## 12 Cost and service reliability

Supabase Free currently lists 500 MB database, 1 GB storage and 5 GB egress, with project pausing after inactivity. Keep pilot targets below 100 MB database and 300 MB stored evidence; individual Free uploads must fit the 50 MB limit. Export encrypted database backups and file manifests to private cloud storage, retain only a short rotation, and test restoration. Scheduled activity is not a guarantee against provider pause/outage. [R19]

Verified Earth Engine Community projects receive 150 EECU-hours/month. Use one eligible project, small areas and cached outputs. GitHub private Free repositories include 2,000 Actions minutes/month; standard public-repository runners have different billing, but dataset privacy/licensing must decide repository visibility. Do not make data public simply to avoid cost. Personal Codespaces includes 120 core-hours/month; stop unused sessions. [R20–R22]

Hourly rain processing means up to 720 monthly invocations; measure a real run, include PDF/CI/backfill usage, and budget before retaining that cadence. Process only new assets and share weather-cell fetches. If quota approaches its limit, reduce polling to three-hourly and expose that cadence rather than pretending to maintain hourly refreshes.

Vercel Hobby is limited to eligible personal noncommercial use; verify project eligibility or use an appropriate funded plan/trial. Supabase scheduling avoids Vercel Hobby's daily-only cron restriction. Edge Functions have tight CPU limits, so heavy processing stays in Actions. [R23–R25]

Lovable Free currently provides five daily build credits up to 30/month. Batch UI requests and edit logic in Codespaces. The audit's fixed $25 Pro allowance is a proposed cap, not an authorized purchase or confirmed total budget. Check current regional checkout, runtime/model charges and approval before spending. Free tiers make a small demo plausible, not a guaranteed permanent $0 or under-$25 city service. [R26]

After the hackathon, scale by adding verified sites, indexed spatial queries, shared grid-cell caches and measured job capacity. Consider a dedicated managed worker/queue if Actions latency or quotas become unsuitable. Expand to Cox's Bazar, Rangamati, Bandarban or Sylhet only after local data, thresholds and user validation; no direct geographic transfer is assumed.

## 13 Submission and demonstration package

Prepare a Vercel URL with read-only sanitized demo access and separately supplied reviewer test credentials; repository/release commit and reproducible instructions; a two-page architecture document; a proposed three-minute demo video; held-out/replay results; a Bangla/English sample PDF; preflight/freshness evidence; and an achieved/experimental/future claims sheet. These are our recommended package, subject to the organizer's exact upload requirements.

The video shows: local problem and July case; map to before/after evidence; rainfall and BMD conflict; recorded reviewer decision; saved bilingual report; then evaluation and cloud architecture/cost. Include only working features. Use the finale's 5–10-minute window for a seven-minute rehearsal with the story owner speaking, app owner demonstrating and data owner answering technical questions. Keep a recorded fallback and request a supervised pre-monsoon 2027 pilot, without promising institutional acceptance.

## 14 Final note for mentor review

The build decision is now concrete: one Vercel web application, one team-owned Supabase backend, and resumable Python processing in the cloud. Our immediate priority is a real, traceable case-to-review-to-report workflow. Cloud Score+ and Dynamic World provide visible pretrained AI; further models earn their place through access, labels and measured results.

Jaz's review should settle the three site boundaries, primary user and domain reviewer, owner availability, rule configuration, deadline/access requirements, optional AI permission and spending limits. These decisions refine the chosen design rather than reopening multiple architectures.

This plan distinguishes source checks from completed implementation. Forecast access and NASA metadata were checked previously; BMD RSS and the July CAP conflict were checked directly for this revision. Earth Engine credentials/exports, authenticated NASA parsing, deployment, forecasts' local accuracy and software acceptance tests remain construction gates. We will not claim exact landslide prediction, illegal-cut detection, automated official warnings, prevented casualties, institutional endorsement or guaranteed free operation without evidence.

Construction begins with the cloud deployment and data-access gate, then proceeds in the sequence above. The prototype is ready for review when its deployed loop, access rules, source provenance and report integrity pass the release checks and its remaining limits are stated plainly.

## Appendix A Disposition of the audit issues

The supplied audit's 27-item register is retained here as implementation dispositions. Each item is open until its evidence is recorded in the repository.

| Audit items | Resolution and gate |
| --- | --- |
| 1 Conflicting plans; 2 Backend ownership | This document supersedes earlier stacks; owned Supabase before Lovable connection, Step 1 |
| 3 Provider access; 4 Deadline/prize rules | Actual export/parse/forecast tests; organizer confirmation, 9–10 Oct |
| 5 Visible AI; 6 QA60 gap | Cloud Score+/Dynamic World mandatory when available; measured experiments gated, Steps 4–6 |
| 7 CAP validity; 9 Feed discovery; 10 Time zones | Preserve both windows, no automatic extension; RSS plus index/XML; UTC and explicit UTC+6, Steps 3–4 |
| 8 Pilot polygons | Verify three sites and held-out locations before analysis, Step 2 |
| 11 Bangla; 12 Function limits | Font/shaping test; heavy PDF/geospatial work in Actions, Step 5 |
| 13 Missed schedules | Dispatch plus backup schedule, leases/heartbeats/watchdog, Step 4 |
| 14 False positives; 15 Threshold transfer | Comparable windows/QA; station and satellite series separate, Sections 5–6 |
| 16 User validation; 22 Small evaluation | Permissioned feedback; held-out counts and denominators, 12 Oct |
| 17 Claims/licences; 25 Conflicting rain windows | Claim register and required attribution; no unsourced storm number, Appendix B |
| 18 Venue network | Sanitized replay assets, downloaded video/report and network-failure rehearsal |
| 19 DEM/IMERG units | Projection, rate/accumulation and fill-value fixtures plus actual-file checks |
| 20 Pause/backups | Provider health check, encrypted private backup and tested restore |
| 21 Credits | Batch prompts, cloud code edits and verified spending cap |
| 23 Voice; 24 Foundation models | Deferred beyond the core release; separate consent/compatibility gates |
| 26 Jangal Salimpur sensitivity | Chashma-led story; bounded environmental study, verified jurisdiction |
| 27 Ensemble archive | July replay uses as-of archived forecasts/estimated rainfall; members only where genuinely archived |

The audit's 17 preflight traps map to those checks: backend ownership, build credits, Bangla shaping, Bangladesh time, unlabeled index time, CAP coordinate order, validity conflicts, cloud QA, DEM projection, rainfall units, forecast intervals, shared grids, Edge CPU, database pause/backup, scheduling, venue network and ensemble retention. Test each relevant behavior and preserve the outcome.

## Appendix B Research and claim register

**Prior art:** cite the Ahmed et al. Chattogram warning research, YPSA/RIMES anticipatory-action work and BMD alerts. PaharPahara's proposed contribution is their combination with fresh disturbance evidence and an officer review/report workflow. Avoid first-in-the-world or superior-to-existing-system claims. [R15–R16]

**Benchmarks and extensions:** LHASA is a global landslide model, not hill-cut truth; DIST-ALERT detects vegetation disturbance, not an environmental offence. Compare like dates/areas only after endpoint/archive coverage checks. AlphaEarth annual embeddings can support an annual change prior or features, not last-month detection; check year availability before using the proposed 2024–2025 comparison. Sentinel-1 requires matched orbit/pass/polarization and layover/shadow/wetness QA. NICFI is not assumed a free current fallback. Dated COOLR/inventory/news events identify candidates, not pixel labels. The reported 730-event Rabby/Li inventory still needs file, licence, location and timing checks. Drone photogrammetry is a future path to excavation volume. [R27–R29]

**Additional threshold candidates from the audit:** Ahmed et al.'s proposed five-day bands of 70–160, 161–250 and above 250 mm, and the cited older 96 mm/24-hour or 185 mm/48-hour rule, are retained for primary-source verification. Resolve endpoint inclusivity and measurement context before activating a comparison. None is a validated site-level trigger in this prototype.

**Claims held for source audit:** the supplied figures of 412 mm, 394.3 mm and 330.8 mm describe different reported time windows. Retain station, interval endpoints and source; do not mix them with a satellite-grid total or repeat a record-ranking claim without the station record. Also hold the 6,558 families/26 hills, 50 enforcement drives, 27 misclassified hills, 120 hills lost, historical hill-area loss, 2007 death count, nationwide totals, smartphone share and tree-cover-loss share until their exact sources/definitions are checked. The reported 6 July nine-hill evacuation and 2018/May 2025 replay cases can be added after location, date and as-of data verification.

Retain competing estimates as conflicting claims, not a combined population number. Hill cutting may amplify slope risk alongside rainfall, soils and drainage; do not present it as the sole cause. The dry-season-cutting/monsoon-lead-time idea remains a hypothesis until case dates support it. Sister-chapter rubrics, global supporter counts and possible Lovable prizes are context, not Bangladesh scoring rules.

**Licences:** preserve exact provider-required notices in the source registry, app and reports, including modified Copernicus DEM, Sentinel, Dynamic World/Cloud Score+, Open-Meteo and GSMaP terms. Record licences for model checkpoints, label sets, field photographs and map layers. Use permitted original/copied assets, not scraped Google Earth imagery. The inventory's availability/timing and foundation-model input mapping remain audited research tasks.

## References

Service documentation and key source claims checked on 9 October 2026. References also retain research cited in the supplied audit; remaining source checks are identified in the plan. Access to a document does not establish a successful integration.

- R1 [BSS July 2026 event report](https://www.bssnews.net/district/403709)
- R2 [Lovable external deployment](https://docs.lovable.dev/tips-tricks/external-deployment-hosting)
- R3 [TanStack Start on Vercel](https://vercel.com/docs/frameworks/full-stack/tanstack-start)
- R4 [Lovable connection to owned Supabase](https://docs.lovable.dev/integrations/supabase)
- R5 [Sentinel-2 SR Harmonized](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)
- R6 [Cloud Score Plus](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_CLOUD_SCORE_PLUS_V1_S2_HARMONIZED)
- R7 [Dynamic World](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1)
- R8 [Updated Copernicus DEM](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_DEM_GLO30_2024_1)
- R9 [NASA IMERG](https://gpm.nasa.gov/data/imerg)
- R10 [GSMaP operational V8](https://developers.google.com/earth-engine/datasets/catalog/JAXA_GPM_L3_GSMaP_v8_operational)
- R11 [Open-Meteo forecast API](https://open-meteo.com/en/docs)
- R12 [Open-Meteo ensemble API](https://open-meteo.com/en/docs/ensemble-api)
- R13 [Open-Meteo Single Runs](https://open-meteo.com/en/docs/single-runs-api)
- R14 [BMD RSS](https://cap.bmd.gov.bd/api/cap/rss.xml), [alert index](https://cap.bmd.gov.bd/bmd-cap-alerts/), [5 July CAP XML](https://cap.bmd.gov.bd/api/cap/049e2b30-4935-4e7f-9b24-3b281728816d.xml)
- R15 [YPSA local trigger validation](https://ypsa.org/2025/05/landslide-early-warning-chattogram-validates-trigger-thresholds-for-anticipatory-action/)
- R16 [Ahmed et al. Chattogram warning research](https://www.mdpi.com/2220-9964/7/12/485); proposed additional thresholds require review against this research and the GSB source cited in the supplied audit
- R17 [Environment Conservation Act section 6B](https://bdlaws.minlaw.gov.bd/act-791/section-41083.html)
- R18 [Official Bangladesh event schedule](https://hackathonbd2026.lovable.app/)
- R19 [Supabase pricing](https://supabase.com/pricing), [file limits](https://supabase.com/docs/guides/storage/uploads/file-limits), [PostGIS](https://supabase.com/docs/guides/database/extensions/postgis), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- R20 [Earth Engine noncommercial tiers](https://developers.google.com/earth-engine/guides/noncommercial_tiers)
- R21 [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- R22 [Codespaces billing](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces)
- R23 [Vercel plan eligibility](https://vercel.com/docs/limits/fair-use-guidelines)
- R24 [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Supabase Cron](https://supabase.com/docs/guides/cron/quickstart)
- R25 [Edge Function limits](https://supabase.com/docs/guides/functions/limits), [GitHub schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- R26 [Lovable pricing and credits](https://lovable.dev/pricing)
- R27 [NASA LHASA repository](https://github.com/nasa/lhasa)
- R28 [NASA DIST-ALERT product](https://www.earthdata.nasa.gov/data/catalog/lpcloud-opera-l3-dist-alert-hls-v1-1)
- R29 [Annual satellite embeddings](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL)
