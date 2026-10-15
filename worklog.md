# PaharPahara — Project Worklog

**Project:** PaharPahara — Hill disturbance screening & weather preparedness prototype for Chattogram, Bangladesh.
**Stack (adapted from plan):** Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite) + NextAuth.js v4 + Recharts. The plan called for Supabase/Earth Engine/TanStack Start, but our sandbox stack uses Next.js + Prisma/SQLite; provider feeds (Sentinel-2, IMERG, Open-Meteo, BMD CAP) are represented by clearly-labelled historical/demo data persisted in SQLite, with adapter interfaces that could be wired to live APIs later.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Initialize worklog, design Prisma schema, seed realistic historical data for the Chashma Hill 8 July 2026 case + Jangal Salimpur + Nagin Hill.

Work Log:
- Read both upload prompt files (Definitive Prototype Plan + End-to-End Build Prompt Pack).
- Inspected existing scaffold: Next.js 16, Prisma+SQLite, shadcn/ui components already installed, .env configured with `DATABASE_URL=file:/home/z/my-project/db/custom.db`.
- Planned adaptation: single `/` route with tabbed dashboard SPA, NextAuth credentials auth, seeded demo accounts, mock data layer labelled "historical replay", bilingual EN/BN.

Stage Summary:
- Architecture decision: keep all UI on `/` (per sandbox rule), use client-side view-state for tab switching.
- Schema plan: User, Site, SourceRegistry, RawAsset, WeatherInterval, Bulletin, Case, Assessment, ReviewHistory, ReportVersion, Job, Notification, AuditLog.
- Seed plan: 3 sites (Chashma Hill, Jangal Salimpur, Nagin Hill), 2 cases (Chashma July 8 disturbance + Salimpur monitor), BMD CAP with 5 July validity conflict, IMERG rainfall intervals with completeness gaps, Open-Meteo forecast, Sentinel-2 before/after assets (placeholder satellite chips), Cloud Score+/Dynamic World probabilities.

---
Task ID: 2-assetgen
Agent: image-asset-generator
Task: Generate SVG satellite-chip placeholder assets for the PaharPahara prototype.

Work Log:
- Read /home/z/my-project/worklog.md to confirm Task 1 context (3 sites: Chashma Hill, Jangal Salimpur, Nagin Hill; before/after Sentinel-2 SR chips referenced by scripts/seed.ts at /assets/satellite/*.svg).
- Cross-checked filenames against scripts/seed.ts (lines 292, 310, 417, 434, 501, 518) so the placeholder chips line up exactly with the seeded RawAsset.fileUri values; confirmed the case metadata that must appear in the title pills (Chashma: 1.34 ha / NDVI -0.27 / bare +0.41 / 71% coverage / 2026-07-09T04:55:51Z; Salimpur: NDVI -0.09 / seasonal candidate / 2026-07-12; Nagin: 2.18 ha / NDVI -0.34 / bare +0.52 / field-corroborated 2026-06-27 / 2026-06-18).
- Verified /home/z/my-project/public/assets/satellite/ existed but was empty (target directory was pre-created by Task 1).
- Designed a shared visual language for all 6 chips: 800x600 viewBox, semi-transparent black title bar with 3 lines (site/state, source+date, "HISTORICAL REPLAY — placeholder chip" tag), white-fill north arrow top-right, dashed-contour hill silhouettes with canopy dot texture, ground baseline strip, "100 m" scale bar bottom-right, italic "Stylized placeholder — not actual Sentinel-2 imagery" footer.
- Picked a single palette (oklch-derived hex equivalents documented in inline comments): forest gradient #7abb4e -> #468f3f -> #2d7a45 (oklch(0.65 0.12 140) -> oklch(0.45 0.10 150)); Nagin dark canopy #4a9c4c -> #2f7a3c -> #1f5d2c; bare/disturbed #c47a4c (oklch(0.55 0.13 35)) with #9c5a30 inner shadow and #e09a5e highlight; text #222222 (oklch(0.20 0 0)); title-bar accent #ffe08a / #cfe8d6 / #ffffff.
- Drew three distinct hill shapes so the sites are visually distinguishable: Chashma = broad gentle single-peak (~670px wide, peak y≈274); Salimpur = smaller, lower, more rounded (~490px wide, peak y≈425); Nagin = twin-peak dark-canopy hill (~660px wide, peaks at x≈340 and x≈540, y≈340) enclosed by a dashed orange "Forest Dept. Jurisdiction" boundary rect with label.
- Implemented per-file specs:
  * chashma_before_2026-06-22.svg: undisturbed forested Chashma hill, full canopy, no annotation pill.
  * chashma_after_2026-07-09.svg: same hill shape; reddish-brown bare patch polygon on south face with hatch-pattern overlay + dashed outline + inner scar streaks; translucent cloud-shadow polygons covering the east (right) edge with a "cloud shadow (E edge)" pill; "71% coverage" appended to title pill; cleared-patch label pill reads "Δ NDVI -0.27 • Δ bare +0.41 • 1.34 ha".
  * salimpur_before_2026-07-04.svg: smaller gentle hill, mixed-species canopy dots.
  * salimpur_after_2026-07-12.svg: same hill; small subtle yellowing patch (#d2c15a) on mid-slope with light olive hatch outline; label pill reads "Δ NDVI -0.09 • seasonal candidate".
  * nagin_before_2026-05-11.svg: twin-peak dark-canopy hill inside dashed orange Forest Dept. Jurisdiction boundary.
  * nagin_after_2026-06-18.svg: same hill + boundary; large reddish-brown cleared patch (>2 ha) on south face with layered scar/highlight polygons, hatch overlay, and dashed outline; label pill reads "Δ NDVI -0.34 • Δ bare +0.52 • 2.18 ha • field-corroborated 2026-06-27".
- Used <clipPath> on each hill shape so contour lines and canopy dots stay inside the silhouette; contour lines use stroke-dasharray="3 4" as required; cleared-patch outlines use stroke-dasharray="5 3" / "4 3".
- Restrained the element vocabulary to required primitives (<path>, <polygon>, <circle>, <rect>, <text>) plus standard structural/definitional elements (<g>, <defs>, <clipPath>, <linearGradient>, <pattern>, <stop>, <line>, <title>, <desc>). No external images, fonts, scripts, or filters; everything inline so each file renders standalone via <img src="...">.
- Validated all 6 files with xmllint --noout (all OK) and listed per-file tag sets to confirm consistency.

Stage Summary:
- Produced 6 standalone SVGs totalling ~37 KB in /home/z/my-project/public/assets/satellite/:
  * chashma_before_2026-06-22.svg  (5,624 bytes)
  * chashma_after_2026-07-09.svg   (7,119 bytes)
  * salimpur_before_2026-07-04.svg (5,147 bytes)
  * salimpur_after_2026-07-12.svg  (5,844 bytes)
  * nagin_before_2026-05-11.svg    (6,293 bytes)
  * nagin_after_2026-06-18.svg     (7,041 bytes)
- All files are well-formed XML, share the 800x600 viewBox + identical title-bar / north-arrow / scale-bar / footer-caption chrome, use only inline SVG primitives, and clearly self-identify as "HISTORICAL REPLAY — placeholder chip" plus a footer disclaimer so no one mistakes them for real Sentinel-2 imagery.
- Filenames match the fileUri values seeded in scripts/seed.ts exactly, so the dashboard's RawAsset links will resolve out of the box once the Next.js app serves /public.

---

---
Task ID: 1..10
Agent: main (Z.ai Code)
Task: Build complete PaharPahara prototype — schema, auth, API, UI, verification.

Work Log:
- Designed Prisma schema with 11 models (User, Site, SourceRegistry, RawAsset, WeatherInterval, Bulletin, Case, Assessment, ReviewHistory, ReportVersion, Job, Notification, AuditLog) and pushed to SQLite.
- Wrote comprehensive seed script with realistic historical data for the Chashma Hill 8 July 2026 case + Jangal Salimpur (seasonal candidate) + Nagin Hill (closed/reviewed). Includes: 5 demo accounts with role matrix, 3 sites with verified geometries, 9 source registry entries (Sentinel-2, Cloud Score+, Dynamic World, Copernicus DEM, IMERG, GSMaP, Open-Meteo, Open-Meteo Ensemble, BMD CAP), 11 raw assets, 3 cases with before/after pairs, 6 review history entries, 1 assessment + report version with full fact snapshot, 48 IMERG half-hour intervals with intentional gaps (indices 17, 18, 33) to demonstrate completeness-aware totals, 24 Open-Meteo forecast intervals, 2 BMD CAP bulletins (5 July with documented validity conflict + October "no active alert"), 5 jobs (running/failed/completed mix), 4 notifications.
- Built NextAuth credentials provider with bcrypt/demo-hash support and 5-role capability matrix (admin, doe_reviewer, forest_officer, preparedness, viewer). Each role sees a different set of tabs.
- Built 13 API routes: /api/auth/[...nextauth], /api/dashboard (single mega-query for SPA), /api/sites, /api/sites/[slug], /api/cases, /api/cases/[caseId]/review (with optimistic-revision check + transition validation), /api/cases/[caseId]/report (freezes fact snapshot, queues render_pdf job), /api/weather (with completeness-aware totals for 24/48/72/120h), /api/bmd, /api/sources, /api/jobs, /api/notifications, /api/notifications/[id]/read, /api/reports/[id]?format=html&lang=en|bn (printable bilingual report).
- Built single-route SPA on `/` with: login screen (left brand panel + right form + 5 demo-account buttons), tabbed dashboard header (role-filtered tabs, language toggle EN/BN, notifications bell, user avatar + sign out), sticky footer with disclaimer + version.
- Built 8 views: Dashboard (BMD banner with validity-conflict tag, 4 stat cards, Chattogram SVG map with site markers + BMD alert polygon overlay + river + legend, recent cases list, source-health panel, jobs mini-panel), Sites (map + list, drill-down to SiteDetail with before/after slider, NDVI/bare-soil/DW probability metrics, rainfall chart with completeness gaps shown as yellow bars, 24/48/72/120h totals, provenance panel), Cases (status-filtered queue + CaseDetail with before/after slider, change metrics grid with warn tone, provenance cards with SHA-256, revision history timeline, decision form with role-aware dropdown + permit status + rationale + next action + submit + request-report), Reports (grid of report versions with hash + open-printable button + integrity explanation), Sources (4 summary cards + adapter list with access-state badges + licence + notes), Jobs (4 stat cards + job list with state badges + lease/heartbeat + error + payload expandable), Notifications (mark-all-read + per-category icons + acknowledge), Preparedness (BMD bulletins with validity-conflict banner, rainfall summary cards with YPSA 100mm/24h trigger comparison, combined observed+forecast chart with YPSA threshold reference line).
- Generated 6 SVG satellite-chip placeholders (Chashma before/after, Salimpur before/after, Nagin before/after) via image-asset-generator subagent — each clearly labeled "HISTORICAL REPLAY — placeholder chip" with hill silhouettes, contour lines, hatched disturbance polygons, north arrow, scale bar.
- Built before/after slider component with drag handle, pointer + touch events, and percentage-positioned clipping.
- Built ChattogramMap SVG component with hill markers, BMD alert polygon overlay, Karnaphuli river, compass, scale bar, legend, hover tooltips.
- Implemented bilingual EN/BN dictionary covering all UI strings, persisted to localStorage.
- Custom earth-tone color palette (forest green primary, warm sand accent, amber/emerald/sky/rose semantic colors) with light + dark mode.

Verification (agent-browser end-to-end):
- ✓ Login flow with all 5 demo accounts works.
- ✓ Dashboard renders: BMD banner with VALIDITY CONFLICT tag, 4 stat cards, Chattogram map with 3 sites, recent cases list (3 cases), source-health panel (9 adapters), jobs mini-panel.
- ✓ Tab navigation works for all role-allowed tabs.
- ✓ Case detail view: before/after slider visible, change metrics grid (NDVI -0.27, bare-soil +0.41, all yellow-warned), provenance cards with SHA-256, revision history timeline with green dots.
- ✓ Review workflow end-to-end: opened CHASHMA-2026-07-08 case, selected "Approve (mark reviewed)" decision, filled rationale + next action, clicked Submit — case status moved from "under_review" to "reviewed" (filter counts changed: Active 2→1, Reviewed 1→2). Case revision bumped from 1 → 2.
- ✓ Reports view shows the seeded Nagin report with hash + open-printable button.
- ✓ Printable report (HTML) renders with full data: site/jurisdiction, evidence (Sentinel-2 asset IDs + coverage), change metrics, uncertainty notes, reviewer decision (Tanvir Hossain, approved, full rationale), integrity (SHA-256 hash + pinned case revision). Both EN and BN versions render with proper Bengali typography (Noto Sans Bengali).
- ✓ Sources view shows all 9 adapters with access-state badges (1 live, 6 historical_replay, 2 unavailable).
- ✓ Jobs view shows 5 jobs with state badges, lease/heartbeat, error messages, payload expandable.
- ✓ Preparedness view shows BMD bulletins with validity-conflict red banner, 3 rainfall summary cards with YPSA trigger comparison, combined observed+forecast chart with YPSA threshold reference line and colored bars (blue=observed, teal=forecast, yellow=missing).
- ✓ Bengali language toggle works across ALL UI: nav, headings, filters, case lists, report content, dates (Bengali numerals + Asia/Dhaka timezone).
- ✓ Role-based tab filtering: doe_reviewer doesn't see Preparedness tab; admin sees all 8 tabs.
- ✓ Sticky footer pushes down naturally with content (verified via VLM — footer visible at bottom of long pages).
- ✓ Dev server runs persistently via start-dev.sh launcher (setsid-detached).
- ✓ Lint passes clean (`bun run lint` returns no errors).
- ✓ No browser console errors during testing.

Stage Summary:
- Application is fully functional end-to-end. The complete evidence → validate → display → human decision → saved bilingual report loop works as specified in the plan.
- The CHASHMA-2026-07-08 case demonstrates the full workflow (reviewer approves → status transitions → revision bumps → report requestable).
- All provider feeds are clearly labelled "historical_replay" or "unavailable" — no fake "live" claims.
- BMD CAP 5 July 2026 bulletin preserves both validity windows (XML 24h + text 72h) and surfaces the conflict for human review.
- Rainfall totals are completeness-aware (3 intentional IMERG gaps shown as yellow bars + "Incomplete" badge with actual/expected interval count).
- Reports freeze fact snapshots at request time with SHA-256 integrity hash + pinned case revision.
- Bangla rendering verified with Noto Sans Bengali font in both UI and printable reports.

Demo accounts:
- admin@paharpahara.bd / admin123 (all capabilities)
- reviewer@paharpahara.bd / reviewer123 (DoE reviewer — case review + report request)
- forest@paharpahara.bd / forest123 (forest officer — field corroborate)
- preparedness@paharpahara.bd / prep123 (disaster management — preparedness view)
- viewer@paharpahara.bd / viewer123 (read-only)
