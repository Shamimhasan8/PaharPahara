'use client'

// PaharPahara — SVG map of monitored Chattogram hills.
// Pure SVG with site markers, labels, and BMD alert polygon overlay.

import { useState } from 'react'
import type { SiteDTO, BulletinDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'
import { dict } from '@/lib/i18n'

interface Props {
  sites: SiteDTO[]
  bulletins: BulletinDTO[]
  lang: Lang
  selectedSiteId?: string
  onSelectSite?: (slug: string) => void
  height?: number
}

export function ChattogramMap({ sites, bulletins, lang, selectedSiteId, onSelectSite, height = 360 }: Props) {
  const t = dict[lang]
  const [hover, setHover] = useState<string | null>(null)

  // Bounding box around Chattogram division
  const minLng = 91.0
  const maxLng = 92.4
  const minLat = 22.0
  const maxLat = 22.9
  const width = 800
  const height_ = height
  const pad = 30

  const xScale = (lng: number) => pad + ((lng - minLng) / (maxLng - minLng)) * (width - 2 * pad)
  const yScale = (lat: number) => pad + (1 - (lat - minLat) / (maxLat - minLat)) * (height_ - 2 * pad)

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
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={width} height={height_} fill="url(#topo)" />
        <rect x="0" y="0" width={width} height={height_} fill="oklch(0.97 0.008 95)" opacity="0.4" />

        {/* BMD alert polygons */}
        {alertPolygons.map((p) => (
          <g key={p.id}>
            <polygon points={p.points} fill="oklch(0.65 0.20 25 / 0.10)" stroke="oklch(0.55 0.20 25 / 0.5)" strokeWidth="1.5" strokeDasharray="6 3" />
            <text
              x={Math.min(...p.points.split(' ').map((s) => parseFloat(s.split(',')[0]))) + 4}
              y={Math.min(...p.points.split(' ').map((s) => parseFloat(s.split(',')[1]))) + 14}
              className="text-[10px]"
              fill="oklch(0.40 0.18 25)"
              fontWeight="600"
            >
              BMD Alert
            </text>
          </g>
        ))}

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
          return (
            <g
              key={site.id}
              transform={`translate(${x} ${y})`}
              className={onSelectSite ? 'cursor-pointer' : ''}
              onClick={() => onSelectSite?.(site.slug)}
              onMouseEnter={() => setHover(site.id)}
              onMouseLeave={() => setHover(null)}
            >
              {/* Hill icon */}
              <path
                d="M -12 8 L -6 -4 L 0 4 L 6 -8 L 12 8 Z"
                fill={isUnverified ? 'oklch(0.85 0.10 70)' : 'url(#hillgrad)'}
                stroke={isSelected ? 'oklch(0.42 0.09 152)' : isUnverified ? 'oklch(0.55 0.10 70)' : 'oklch(0.45 0.08 150)'}
                strokeWidth={isSelected ? 2.5 : 1.2}
              />
              {/* Pulse ring for selected */}
              {isSelected && <circle r="14" fill="none" stroke="oklch(0.42 0.09 152 / 0.4)" strokeWidth="1.5" className="animate-ping" />}

              {/* Label */}
              <g transform={`translate(0 ${isHovered ? -16 : 14})`}>
                <rect
                  x={-(site.nameEn.length * 3 + 6)}
                  y="-9"
                  width={site.nameEn.length * 6 + 12}
                  height="14"
                  rx="3"
                  fill="oklch(1 0 0 / 0.92)"
                  stroke="oklch(0.85 0.02 150)"
                  strokeWidth="0.5"
                />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  className="text-[9px]"
                  fill="oklch(0.25 0.02 150)"
                  fontWeight={isHovered || isSelected ? 600 : 500}
                >
                  {lang === 'bn' ? site.nameBn.split(' ')[0] : site.nameEn.split(' ')[0]}
                </text>
              </g>

              {/* Hover tooltip */}
              {isHovered && (
                <g transform={`translate(${site.lng > 91.85 ? -160 : 14} -40)`}>
                  <rect x="0" y="0" width="150" height="34" rx="4" fill="oklch(0.18 0.02 150)" opacity="0.95" />
                  <text x="8" y="13" className="text-[9px]" fill="white" fontWeight="600">
                    {lang === 'bn' ? site.nameBn : site.nameEn}
                  </text>
                  <text x="8" y="25" className="text-[8px]" fill="oklch(0.85 0.02 150)">
                    {site.district} • {site.areaHectares.toFixed(1)} ha
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Compass */}
        <g transform={`translate(${width - 50} 50)`}>
          <circle r="18" fill="none" stroke="oklch(0.50 0.05 150 / 0.4)" strokeWidth="0.8" />
          <path d="M 0 -12 L 4 0 L 0 12 L -4 0 Z" fill="oklch(0.40 0.05 25)" opacity="0.7" />
          <text x="0" y="-22" textAnchor="middle" className="text-[8px]" fill="oklch(0.40 0.02 150)" fontWeight="700">N</text>
        </g>

        {/* Scale */}
        <g transform={`translate(40 ${height_ - 25})`}>
          <line x1="0" y1="0" x2="60" y2="0" stroke="oklch(0.30 0.02 150)" strokeWidth="1.5" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="oklch(0.30 0.02 150)" strokeWidth="1.5" />
          <line x1="60" y1="-3" x2="60" y2="3" stroke="oklch(0.30 0.02 150)" strokeWidth="1.5" />
          <text x="30" y="-6" textAnchor="middle" className="text-[8px]" fill="oklch(0.30 0.02 150)">~15 km</text>
        </g>

        {/* Legend */}
        <g transform={`translate(${width - 180} ${height_ - 60})`}>
          <rect x="0" y="0" width="160" height="48" rx="4" fill="oklch(1 0 0 / 0.9)" stroke="oklch(0.85 0.02 150)" strokeWidth="0.5" />
          <path d="M 8 14 L 12 8 L 16 14 L 20 8 L 24 14 Z" fill="url(#hillgrad)" stroke="oklch(0.45 0.08 150)" strokeWidth="0.5" />
          <text x="30" y="14" className="text-[8px]" fill="oklch(0.30 0.02 150)">{lang === 'bn' ? 'যাচাইকৃত সাইট' : 'Verified site'}</text>
          <path d="M 8 30 L 12 24 L 16 30 L 20 24 L 24 30 Z" fill="oklch(0.85 0.10 70)" stroke="oklch(0.55 0.10 70)" strokeWidth="0.5" />
          <text x="30" y="30" className="text-[8px]" fill="oklch(0.30 0.02 150)">{lang === 'bn' ? 'অযাচাইকৃত সাইট' : 'Unverified site'}</text>
          <polygon points="100,8 130,8 130,30 100,30" fill="oklch(0.65 0.20 25 / 0.10)" stroke="oklch(0.55 0.20 25 / 0.5)" strokeWidth="1" strokeDasharray="3 2" />
          <text x="138" y="22" className="text-[8px]" fill="oklch(0.40 0.18 25)">BMD</text>
        </g>
      </svg>

      <div className="absolute top-3 left-3 bg-card/90 backdrop-blur px-2 py-1 rounded text-[10px] text-muted-foreground border border-border">
        {lang === 'en' ? 'Chattogram region — WGS84 display' : 'চট্টগ্রাম অঞ্চল — WGS84 প্রদর্শন'}
      </div>
    </div>
  )
}
