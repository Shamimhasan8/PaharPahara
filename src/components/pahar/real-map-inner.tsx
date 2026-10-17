'use client'

// PaharPahara — Real interactive map using Leaflet + ESRI Satellite imagery.
// Shows ACTUAL satellite photos of Chattogram hills with site markers, popups,
// BMD alert polygon overlay, active-case count badges, and layer switcher.
// Default layer = ESRI World Imagery (real satellite photos showing hills, terrain, vegetation).

import 'leaflet/dist/leaflet.css'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import type { SiteDTO, BulletinDTO, CaseDTO, RiskZoneDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'

// Custom marker icon (SVG-based, no external image files needed)
// Uses risk level for color: red = danger, yellow = warning, green = safe
function createSiteIcon(riskLevel: string, isSelected: boolean, activeCount: number): L.DivIcon {
  const colors: Record<string, string> = {
    red: '#dc2626',
    yellow: '#f59e0b',
    green: '#16a34a',
  }
  const bg = colors[riskLevel] ?? '#16a34a'
  const ring = isSelected ? '#1e293b' : 'white'
  const size = isSelected ? 40 : 34
  const badge = activeCount > 0
    ? `<div style="position:absolute;top:-6px;right:-6px;background:#dc2626;color:white;border-radius:999px;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;font-family:sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.4)">${activeCount}</div>`
    : ''
  return L.divIcon({
    className: 'pahar-site-marker',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4))">
          <path d="M16 2 C10 2 6 6 6 12 c0 7 10 18 10 18 s10-11 10-18 c0-6-4-10-10-10 z" fill="${bg}" stroke="${ring}" stroke-width="2.5"/>
          <circle cx="16" cy="12" r="4.5" fill="white" opacity="0.95"/>
        </svg>
        ${badge}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 5],
  })
}

// Fly-to-selected helper component
function FlyToSelected({ sites, selectedSiteId }: { sites: SiteDTO[]; selectedSiteId?: string }) {
  const map = useMap()
  useEffect(() => {
    if (selectedSiteId) {
      const site = sites.find((s) => s.id === selectedSiteId)
      if (site) {
        map.flyTo([site.lat, site.lng], 15, { duration: 1.2 })
      }
    }
  }, [selectedSiteId, sites, map])
  return null
}

interface Props {
  sites: SiteDTO[]
  bulletins: BulletinDTO[]
  cases?: CaseDTO[]
  riskZones?: RiskZoneDTO[]
  lang: Lang
  selectedSiteId?: string
  onSelectSite?: (slug: string) => void
  height?: number
  enableScrollZoom?: boolean
}

export function RealMapInner({
  sites,
  bulletins,
  cases,
  riskZones,
  lang,
  selectedSiteId,
  onSelectSite,
  height = 380,
  enableScrollZoom = false,
}: Props) {
  // Chattogram center — zoomed in closer to see the hills clearly
  const center: [number, number] = [22.36, 91.82]
  const zoom = 13

  // Active cases per site
  const activeCasesBySite: Record<string, number> = {}
  if (cases) {
    for (const c of cases) {
      if (!['reviewed', 'rejected'].includes(c.status)) {
        activeCasesBySite[c.siteId] = (activeCasesBySite[c.siteId] ?? 0) + 1
      }
    }
  }

  // BMD alert polygons
  const alertPolygons = bulletins
    .filter((b) => b.messageType === 'alert' && b.geometryJson)
    .map((b) => {
      try {
        const g = JSON.parse(b.geometryJson || '{}') as { type: string; coordinates: number[][][] }
        if (g.type === 'Polygon' && g.coordinates?.[0]) {
          const ring = g.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
          return { id: b.id, positions: ring, headline: lang === 'en' ? b.headlineEn : b.headlineBn }
        }
      } catch {
        /* ignore */
      }
      return null
    })
    .filter(Boolean) as Array<{ id: string; positions: [number, number][]; headline: string }>

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={enableScrollZoom}
        attributionControl={true}
        zoomControl={true}
      >
        <LayersControl position="topright">
          {/* DEFAULT: ESRI World Imagery — real satellite photos showing actual hills, terrain, vegetation */}
          <LayersControl.BaseLayer checked name="🛰️ Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS Community'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          {/* Streets overlay — OpenStreetMap */}
          <LayersControl.BaseLayer name="🗺️ Streets">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          {/* Terrain overlay — OpenTopoMap (shows elevation contours) */}
          <LayersControl.BaseLayer name="⛰️ Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenTopoMap (CC-BY-SA) · SRTM'
              maxZoom={17}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* BMD alert polygons */}
        {alertPolygons.map((p) => (
          <Polygon
            key={p.id}
            positions={p.positions}
            pathOptions={{
              color: '#ef4444',
              weight: 2.5,
              opacity: 0.7,
              fillColor: '#ef4444',
              fillOpacity: 0.12,
              dashArray: '8 4',
            }}
          >
            <Popup>
              <div style={{ fontSize: '11px' }}>
                <strong>⚠️ BMD Alert</strong>
                <br />
                {p.headline}
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Risk Zone polygons — Red/Yellow/Green zones */}
        {riskZones?.map((zone) => {
          let positions: [number, number][] = []
          try {
            const g = JSON.parse(zone.geometryJson) as { type: string; coordinates: number[][][] }
            if (g.type === 'Polygon' && g.coordinates?.[0]) {
              positions = g.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
            }
          } catch { /* ignore */ }
          if (positions.length === 0) return null

          const zoneColors: Record<string, { color: string; fill: string }> = {
            red: { color: '#dc2626', fill: '#dc2626' },
            yellow: { color: '#f59e0b', fill: '#f59e0b' },
            green: { color: '#16a34a', fill: '#16a34a' },
          }
          const zc = zoneColors[zone.level] ?? zoneColors.green

          return (
            <Polygon
              key={zone.id}
              positions={positions}
              pathOptions={{
                color: zc.color,
                weight: 2,
                opacity: 0.8,
                fillColor: zc.fill,
                fillOpacity: zone.level === 'red' ? 0.25 : zone.level === 'yellow' ? 0.15 : 0.08,
              }}
            >
              <Popup>
                <div style={{ minWidth: '220px', fontSize: '12px', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: zc.color }}>
                    {zone.level === 'red' ? '🔴' : zone.level === 'yellow' ? '🟡' : '🟢'} {lang === 'bn' ? zone.nameBn : zone.nameEn}
                  </div>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '6px' }}>
                    {lang === 'en' ? 'Area' : 'এলাকা'}: <strong>{zone.areaHectares.toFixed(1)} ha</strong>
                    {zone.populationEstimate && (
                      <span> · {lang === 'en' ? 'Population' : 'জনসংখ্যা'}: <strong>{zone.populationEstimate.toLocaleString()}</strong></span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#444', lineHeight: '1.4' }}>
                    {lang === 'bn' ? zone.reasonBn : zone.reasonEn}
                  </div>
                </div>
              </Popup>
            </Polygon>
          )
        })}

        {/* Site markers */}
        {sites.map((site) => {
          const isSelected = selectedSiteId === site.id
          const activeCount = activeCasesBySite[site.id] ?? 0
          const siteCases = cases?.filter((c) => c.siteId === site.id) ?? []
          const activeCases = siteCases.filter((c) => !['reviewed', 'rejected'].includes(c.status))
          const riskLevel = (site.riskLevel ?? 'green') as string

          return (
            <Marker
              key={site.id}
              position={[site.lat, site.lng]}
              icon={createSiteIcon(riskLevel, isSelected, activeCount)}
              eventHandlers={{
                click: () => onSelectSite?.(site.slug),
              }}
            >
              <Popup>
                <div style={{ minWidth: '220px', fontSize: '12px', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#15803d' }}>
                    {lang === 'bn' ? site.nameBn : site.nameEn}
                  </div>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '8px' }}>📍 {site.district}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '11px' }}>
                    <div>📐 <span style={{ color: '#888' }}>Area:</span> <strong>{site.areaHectares.toFixed(1)} ha</strong></div>
                    <div>📏 <span style={{ color: '#888' }}>Elev:</span> <strong>{site.elevationM} m</strong></div>
                    <div>📐 <span style={{ color: '#888' }}>Slope:</span> <strong>{site.slopeMaxDeg ?? '—'}°</strong></div>
                    <div>⚖️ <span style={{ color: '#888' }}>Juris:</span> <strong style={{ textTransform: 'capitalize' }}>{site.jurisdiction.replace(/_/g, ' ')}</strong></div>
                  </div>
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
                    {activeCases.length > 0 ? (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        🔴 {activeCases.length} active case{activeCases.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a' }}>✅ No active cases</span>
                    )}
                    {siteCases.length > 0 && (
                      <span style={{ color: '#888', marginLeft: '6px' }}>
                        ({siteCases.length} total)
                      </span>
                    )}
                  </div>
                  {onSelectSite && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => onSelectSite(site.slug)}
                        style={{
                          background: '#15803d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        {lang === 'en' ? '🔍 View site details →' : '🔍 সাইট বিস্তারিত দেখুন →'}
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Fly to selected site */}
        <FlyToSelected sites={sites} selectedSiteId={selectedSiteId} />
      </MapContainer>

      {/* Overlay: Chattogram region label (bottom-left to avoid zoom controls) */}
      <div
        className="absolute bottom-6 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-md text-[10px] text-gray-700 border border-gray-300 shadow-sm pointer-events-none"
        style={{ zIndex: 500 }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
        <span className="font-medium">Chattogram, Bangladesh</span>
        <span className="text-gray-400">·</span>
        <span className="font-mono text-gray-500">🛰️ Satellite</span>
      </div>
    </div>
  )
}
