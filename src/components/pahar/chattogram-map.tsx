'use client'

// PaharPahara — SVG map of monitored Chattogram hills.
// Pure SVG with site markers, smart labels (auto-placement to avoid overlap),
// BMD alert polygon overlay, compass, scale, and a fuller legend.

import { useState, useMemo } from 'react'
import type { SiteDTO, BulletinDTO, CaseDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'

interface Props {
  sites: SiteDTO[]
  bulletins: BulletinDTO[]
  cases?: CaseDTO[]
  lang: Lang
  selectedSiteId?: string
  onSelectSite?: (slug: string) => void
  height?: number
}

type LabelPlacement = 'above' | 'below' | 'left' | 'right'

export function ChattogramMap({ sites, bulletins, cases, lang, selectedSiteId, onSelectSite, height = 360 }: Props) {
  const t = dict[lang]
  const [hover, setHover] = useState<string | null>(null)

  // Bounding box around Chattogram division
  const minLng = 91.0
  const maxLng = 92.4
  const minLat = 22.0
  const maxLat = 22.9
  const width = 800
  const height_ = height
  const pad = 36

  const xScale = (lng: number) => pad + ((lng - minLng) / (maxLng - minLng)) * (width - 2 * pad)
  const yScale = (lat: number) => pad + (1 - (lat - minLat) / (maxLat - minLat)) * (height_ - 2 * pad)

  // Smart label placement: spread labels around each site so they don't collide.
  // Uses larger offsets + leader lines so labels are clearly separated from markers
  // and from each other.
  const placements = useMemo(() => {
    const result: Record<string, LabelPlacement> = {}
    // Inline scale functions (avoid stale-closure issues with React Compiler)
    const sx = (lng: number) => pad + ((lng - minLng) / (maxLng - minLng)) * (width - 2 * pad)
    const sy = (lat: number) => pad + (1 - (lat - minLat) / (maxLat - minLat)) * (height_ - 2 * pad)
    const positions = sites.map((s) => ({ id: s.id, x: sx(s.lng), y: sy(s.lat) }))
    // Sort by Y then X so we can place top-to-bottom, left-to-right
    const sorted = [...positions].sort((a, b) => a.y - b.y || a.x - b.x)
    // Larger offsets so labels are clearly separated from markers
    const OFFSET = 36
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i]
      const placed: Array<{ x: number; y: number }> = Object.entries(result).map(([id]) => {
        const p = positions.find((p) => p.id === id)!
        return { x: p.x, y: p.y }
      })
      // Try placements in order of preference, with bigger offsets
      const candidates: Array<{ dir: LabelPlacement; dx: number; dy: number }> = [
        { dir: 'above', dx: 0, dy: -OFFSET },
        { dir: 'right', dx: OFFSET + 8, dy: 0 },
        { dir: 'below', dx: 0, dy: OFFSET },
        { dir: 'left', dx: -OFFSET - 8, dy: 0 },
      ]
      let chosen: LabelPlacement = 'above'
      let bestScore = -Infinity
      for (const c of candidates) {
        const tx = s.x + c.dx
        const ty = s.y + c.dy
        // Penalise off-canvas (need room for label + padding)
        if (tx < 60 || tx > width - 60 || ty < 24 || ty > height_ - 24) continue
        // Score = distance to nearest placed label (maximise)
        let minDist = Infinity
        for (const p of placed) {
          const d = Math.hypot(p.x - tx, p.y - ty)
          if (d < minDist) minDist = d
        }
        if (minDist > bestScore) {
          bestScore = minDist
          chosen = c.dir
        }
      }
      result[s.id] = chosen
    }
    return result
  }, [sites, height_, pad, minLng, maxLng, minLat, maxLat, width])

  // River outline (Karnaphuli) — simplified curve
  const riverPath = `M ${xScale(91.4)} ${yScale(22.45)}
    Q ${xScale(91.6)} ${yScale(22.40)} ${xScale(91.7)} ${yScale(22.35)}
    T ${xScale(92.0)} ${yScale(22.25)}
    Q ${xScale(92.1)} ${yScale(22.20)} ${xScale(92.2)} ${yScale(22.15)}`

  // Active BMD alert polygons (from CAP)
  const alertPolygons = bulletins
    .filter((b) => b.messageType === 'alert' && b.geometryJson)
    .map((b) => {
      try {
        const g = JSON.parse(b.geometryJson || '{}') as { type: string; coordinates: number[][][] }
        if (g.type === 'Polygon' && g.coordinates?.[0]) {
          return { id: b.id, points: g.coordinates[0].map(([lng, lat]) => `${xScale(lng)},${yScale(lat)}`).join(' ') }
        }
      } catch {
        /* ignore */
      }
      return null
    })
    .filter(Boolean) as Array<{ id: string; points: string }>

  // Active cases count per site
  const activeCasesBySite = useMemo(() => {
    const m: Record<string, number> = {}
    if (!cases) return m
    for (const c of cases) {
      if (!['reviewed', 'rejected'].includes(c.status)) {
        m[c.siteId] = (m[c.siteId] ?? 0) + 1
      }
    }
    return m
  }, [cases])

  return (
    <div className="relative w-full rounded-lg border border-border bg-card overflow-hidden" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height_}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="topo" patternUnits="userSpaceOnUse" width="40" height="40">
            <path d="M0 20 Q 10 10 20 20 T 40 20" fill="none" stroke="oklch(0.55 0.05 150 / 0.08)" strokeWidth="0.6" />
            <path d="M0 30 Q 10 20 20 30 T 40 30" fill="none" stroke="oklch(0.55 0.05 150 / 0.08)" strokeWidth="0.6" />
          </pattern>
          <linearGradient id="hillgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.04 130)" />
            <stop offset="100%" stopColor="oklch(0.78 0.03 140)" />
          </linearGradient>
          <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="oklch(0.20 0.02 150)" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={width} height={height_} fill="url(#topo)" />
        <rect x="0" y="0" width={width} height={height_} fill="oklch(0.97 0.008 95)" opacity="0.4" />

        {/* BMD alert polygons */}
        {alertPolygons.map((p) => {
          const xs = p.points.split(' ').map((s) => parseFloat(s.split(',')[0]))
          const ys = p.points.split(' ').map((s) => parseFloat(s.split(',')[1]))
          const minX = Math.min(...xs), minY = Math.min(...ys)
          return (
            <g key={p.id}>
              <polygon points={p.points} fill="oklch(0.65 0.20 25 / 0.10)" stroke="oklch(0.55 0.20 25 / 0.6)" strokeWidth="1.5" strokeDasharray="6 3" />
              <g transform={`translate(${minX + 6} ${minY + 14})`}>
                <rect x="-2" y="-9" width="58" height="13" rx="2" fill="oklch(0.55 0.20 25 / 0.92)" />
                <text x="27" y="0" textAnchor="middle" className="text-[9px]" fill="white" fontWeight="600">
                  BMD Alert
                </text>
              </g>
            </g>
          )
        })}

        {/* Karnaphuli river */}
        <path d={riverPath} fill="none" stroke="oklch(0.60 0.10 220)" strokeWidth="3" opacity="0.5" strokeLinecap="round" />
        <text x={xScale(92.05)} y={yScale(22.30) - 4} className="text-[9px]" fill="oklch(0.50 0.10 220)" fontStyle="italic">
          {lang === 'bn' ? 'কর্ণফুলী নদী' : 'Karnaphuli R.'}
        </text>

        {/* Chattogram city marker */}
        <circle cx={xScale(91.8315)} cy={yScale(22.3275)} r="3" fill="oklch(0.40 0.02 150)" opacity="0.6" />
        <text x={xScale(91.8315) + 6} y={yScale(22.3275) + 3} className="text-[10px]" fill="oklch(0.40 0.02 150)" fontWeight="500">
          {lang === 'bn' ? 'চট্টগ্রাম শহর' : 'Chattogram'}
        </text>

        {/* Site markers */}
        {sites.map((site) => {
          const x = xScale(site.lng)
          const y = yScale(site.lat)
          const isSelected = selectedSiteId === site.id
          const isHovered = hover === site.id
          const isUnverified = site.jurisdiction === 'unverified'
          const placement = placements[site.id] ?? 'above'
          const activeCount = activeCasesBySite[site.id] ?? 0

          // Label position based on smart placement (larger offset)
          const labelDx = placement === 'left' ? -44 : placement === 'right' ? 44 : 0
          const labelDy = placement === 'above' ? -36 : placement === 'below' ? 36 : 0
          const labelAnchor = placement === 'left' ? 'end' : placement === 'right' ? 'start' : 'middle'
          // Leader line endpoints (from marker edge to label edge)
          const leaderX1 = placement === 'left' ? -12 : placement === 'right' ? 12 : 0
          const leaderY1 = placement === 'above' ? -8 : placement === 'below' ? 8 : 0
          const leaderX2 = labelDx + (placement === 'left' ? 4 : placement === 'right' ? -4 : 0)
          const leaderY2 = labelDy + (placement === 'above' ? 6 : placement === 'below' ? -6 : 0)

          // Hover tooltip position
          const tooltipLeft = site.lng > 91.85
          const shortLabel = lang === 'bn' ? (site.nameBn.split(/[ (]/)[0]) : (site.nameEn.split(/[ (]/)[0])

          return (
            <g
              key={site.id}
              transform={`translate(${x} ${y})`}
              className={onSelectSite ? 'cursor-pointer' : ''}
              onClick={() => onSelectSite?.(site.slug)}
              onMouseEnter={() => setHover(site.id)}
              onMouseLeave={() => setHover(null)}
            >
              {/* Pulse ring for selected */}
              {isSelected && <circle r="14" fill="none" stroke="oklch(0.42 0.09 152 / 0.4)" strokeWidth="1.5" className="animate-ping" />}

              {/* Hill icon */}
              <path
                d="M -12 8 L -6 -4 L 0 4 L 6 -8 L 12 8 Z"
                fill={isUnverified ? 'oklch(0.85 0.10 70)' : 'url(#hillgrad)'}
                stroke={isSelected ? 'oklch(0.42 0.09 152)' : isUnverified ? 'oklch(0.55 0.10 70)' : 'oklch(0.45 0.08 150)'}
                strokeWidth={isSelected ? 2.5 : 1.2}
                filter="url(#marker-shadow)"
              />

              {/* Active-case badge (top-right of marker) */}
              {activeCount > 0 && (
                <g transform="translate(10 -8)">
                  <circle r="6" fill="oklch(0.55 0.20 25)" stroke="white" strokeWidth="1" />
                  <text x="0" y="2.5" textAnchor="middle" className="text-[8px]" fill="white" fontWeight="700">{activeCount}</text>
                </g>
              )}

              {/* Leader line from marker to label */}
              <line
                x1={leaderX1}
                y1={leaderY1}
                x2={leaderX2}
                y2={leaderY2}
                stroke={isSelected || isHovered ? 'oklch(0.42 0.09 152 / 0.7)' : 'oklch(0.50 0.05 150 / 0.35)'}
                strokeWidth={isSelected || isHovered ? 1.2 : 0.7}
                strokeDasharray="2 2"
              />

              {/* Label with smart placement */}
              <g transform={`translate(${labelDx} ${labelDy})`}>
                {/* Background pill sized to text */}
                <rect
                  x={labelAnchor === 'middle' ? -(shortLabel.length * 3 + 6) : labelAnchor === 'end' ? -(shortLabel.length * 6 + 8) : -2}
                  y="-9"
                  width={shortLabel.length * 6 + 10}
                  height="14"
                  rx="3"
                  fill="oklch(1 0 0 / 0.96)"
                  stroke={isSelected || isHovered ? 'oklch(0.42 0.09 152 / 0.7)' : 'oklch(0.85 0.02 150)'}
                  strokeWidth={isSelected || isHovered ? 1 : 0.5}
                />
                <text
                  x={labelAnchor === 'middle' ? 0 : labelAnchor === 'end' ? -6 : 4}
                  y="1"
                  textAnchor={labelAnchor as 'middle' | 'start' | 'end'}
                  className="text-[9px]"
                  fill="oklch(0.25 0.02 150)"
                  fontWeight={isHovered || isSelected ? 600 : 500}
                >
                  {shortLabel}
                </text>
              </g>

              {/* Hover tooltip — placed away from marker to avoid overlap */}
              {isHovered && (
                <g transform={`translate(${tooltipLeft ? -180 : 14} -52)`}>
                  <rect x="0" y="0" width="170" height="44" rx="5" fill="oklch(0.18 0.02 150)" opacity="0.96" />
                  <text x="10" y="14" className="text-[10px]" fill="white" fontWeight="600">
                    {lang === 'bn' ? site.nameBn : site.nameEn}
                  </text>
                  <text x="10" y="27" className="text-[8.5px]" fill="oklch(0.85 0.02 150)">
                    {site.district} • {site.areaHectares.toFixed(1)} ha • {site.elevationM} m
                  </text>
                  <text x="10" y="38" className="text-[8.5px]" fill={activeCount > 0 ? 'oklch(0.75 0.18 25)' : 'oklch(0.70 0.10 152)'}>
                    {activeCount > 0
                      ? `${activeCount} ${lang === 'bn' ? 'সক্রিয় কেস' : 'active case(s)'}`
                      : (lang === 'bn' ? 'কোনো সক্রিয় কেস নেই' : 'No active cases')}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Compass — give it a subtle background */}
        <g transform={`translate(${width - 48} 48)`}>
          <circle r="20" fill="oklch(1 0 0 / 0.7)" stroke="oklch(0.50 0.05 150 / 0.3)" strokeWidth="0.8" />
          <circle r="20" fill="none" stroke="oklch(0.50 0.05 150 / 0.4)" strokeWidth="0.8" />
          <path d="M 0 -12 L 4 0 L 0 12 L -4 0 Z" fill="oklch(0.40 0.05 25)" opacity="0.85" />
          <path d="M 0 -12 L 4 0 L 0 0 Z" fill="oklch(0.45 0.18 25)" />
          <text x="0" y="-24" textAnchor="middle" className="text-[8px]" fill="oklch(0.40 0.02 150)" fontWeight="700">N</text>
        </g>

        {/* Scale */}
        <g transform={`translate(40 ${height_ - 22})`}>
          <line x1="0" y1="0" x2="60" y2="0" stroke="oklch(0.30 0.02 150)" strokeWidth="1.5" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="oklch(0.30 0.02 150)" strokeWidth="1.5" />
          <line x1="30" y1="-3" x2="30" y2="3" stroke="oklch(0.30 0.02 150)" strokeWidth="1" />
          <line x1="60" y1="-4" x2="60" y2="4" stroke="oklch(0.30 0.02 150)" strokeWidth="1.5" />
          <text x="30" y="-8" textAnchor="middle" className="text-[8px]" fill="oklch(0.30 0.02 150)" fontWeight="500">~15 km</text>
        </g>

        {/* Legend — wider, not clipped */}
        <g transform={`translate(${width - 188} ${height_ - 76})`}>
          <rect x="0" y="0" width="178" height="64" rx="5" fill="oklch(1 0 0 / 0.94)" stroke="oklch(0.85 0.02 150)" strokeWidth="0.6" />
          <text x="10" y="13" className="text-[8.5px]" fill="oklch(0.30 0.02 150)" fontWeight="700">
            {lang === 'bn' ? 'লিজেন্ড' : 'LEGEND'}
          </text>
          {/* Verified site */}
          <path d="M 10 26 L 14 19 L 18 26 L 22 19 L 26 26 Z" fill="url(#hillgrad)" stroke="oklch(0.45 0.08 150)" strokeWidth="0.5" />
          <text x="34" y="26" className="text-[8.5px]" fill="oklch(0.30 0.02 150)">{lang === 'bn' ? 'যাচাইকৃত সাইট' : 'Verified site'}</text>
          {/* Unverified site */}
          <path d="M 10 42 L 14 35 L 18 42 L 22 35 L 26 42 Z" fill="oklch(0.85 0.10 70)" stroke="oklch(0.55 0.10 70)" strokeWidth="0.5" />
          <text x="34" y="42" className="text-[8.5px]" fill="oklch(0.30 0.02 150)">{lang === 'bn' ? 'অযাচাইকৃত' : 'Unverified site'}</text>
          {/* BMD alert + active-case badge */}
          <polygon points="10,54 26,54 26,63 10,63" fill="oklch(0.65 0.20 25 / 0.10)" stroke="oklch(0.55 0.20 25 / 0.6)" strokeWidth="1" strokeDasharray="3 2" />
          <text x="34" y="60" className="text-[8.5px]" fill="oklch(0.40 0.18 25)">BMD {lang === 'bn' ? 'সতর্কতা' : 'alert'}</text>
          <circle cx="140" cy="32" r="6" fill="oklch(0.55 0.20 25)" stroke="white" strokeWidth="1" />
          <text x="140" y="35" textAnchor="middle" className="text-[7px]" fill="white" fontWeight="700">N</text>
          <text x="151" y="35" className="text-[8px]" fill="oklch(0.30 0.02 150)">{lang === 'bn' ? 'সক্রিয় কেস' : 'Active'}</text>
        </g>
      </svg>

      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-card/90 backdrop-blur px-2.5 py-1.5 rounded-md text-[10px] text-muted-foreground border border-border shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-medium">{lang === 'en' ? 'Chattogram region' : 'চট্টগ্রাম অঞ্চল'}</span>
        <span className="opacity-60">·</span>
        <span className="font-mono opacity-70">WGS84</span>
      </div>
    </div>
  )
}
