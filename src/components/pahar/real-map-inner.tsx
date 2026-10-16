'use client'

// PaharPahara — Real interactive map using Leaflet + OpenStreetMap (client-only).
// Shows actual Chattogram geography with site markers, popups,
// BMD alert polygon overlay, and active-case count badges.

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { SiteDTO, BulletinDTO, CaseDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'

// Fix Leaflet default marker icons (they break with bundlers)
function createSiteIcon(isUnverified: boolean, isSelected: boolean, activeCount: number): L.DivIcon {
  const bg = isUnverified ? '#f59e0b' : '#16a34a'
  const ring = isSelected ? '#15803d' : 'white'
  const size = isSelected ? 38 : 32
  const badge = activeCount > 0
    ? `<div style="position:absolute;top:-6px;right:-6px;background:#dc2626;color:white;border-radius:999px;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:1.5px solid white;font-family:sans-serif">${activeCount}</div>`
    : ''
  return L.divIcon({
    className: 'pahar-site-marker',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
          <path d="M16 2 C10 2 6 6 6 12 c0 7 10 18 10 18 s10-11 10-18 c0-6-4-10-10-10 z" fill="${bg}" stroke="${ring}" stroke-width="2"/>
          <circle cx="16" cy="12" r="4" fill="white" opacity="0.9"/>
        </svg>
        ${badge}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 5],
  })
}

// Component to fly to selected site
function FlyToSelected({ sites, selectedSiteId }: { sites: SiteDTO[]; selectedSiteId?: string }) {
  const map = useMap()
  useEffect(() => {
    if (selectedSiteId) {
      const site = sites.find((s) => s.id === selectedSiteId)
      if (site) {
        map.flyTo([site.lat, site.lng], 14, { duration: 1.2 })
      }
    }
  }, [selectedSiteId, sites, map])
  return null
}

interface Props {
  sites: SiteDTO[]
  bulletins: BulletinDTO[]
  cases?: CaseDTO[]
  lang: Lang
  selectedSiteId?: string
  onSelectSite?: (slug: string) => void
  height?: number
}

export function RealMapInner({ sites, bulletins, cases, lang, selectedSiteId, onSelectSite, height = 380 }: Props) {
  // Chattogram center
  const center: [number, number] = [22.35, 91.82]
  const zoom = 11

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
        scrollWheelZoom={false}
        attributionControl={true}
      >
        {/* OpenStreetMap tiles — real map */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* BMD alert polygons */}
        {alertPolygons.map((p) => (
          <Polygon
            key={p.id}
            positions={p.positions}
            pathOptions={{
              color: '#dc2626',
              weight: 2,
              opacity: 0.6,
              fillColor: '#dc2626',
              fillOpacity: 0.1,
              dashArray: '6 3',
            }}
          >
            <Popup>
              <div style={{ fontSize: '11px' }}>
                <strong>BMD Alert</strong>
                <br />
                {p.headline}
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Site markers */}
        {sites.map((site) => {
          const isUnverified = site.jurisdiction === 'unverified'
          const isSelected = selectedSiteId === site.id
          const activeCount = activeCasesBySite[site.id] ?? 0
          const siteCases = cases?.filter((c) => c.siteId === site.id) ?? []
          const activeCases = siteCases.filter((c) => !['reviewed', 'rejected'].includes(c.status))

          return (
            <Marker
              key={site.id}
              position={[site.lat, site.lng]}
              icon={createSiteIcon(isUnverified, isSelected, activeCount)}
              eventHandlers={{
                click: () => onSelectSite?.(site.slug),
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px', fontSize: '12px', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                    {lang === 'bn' ? site.nameBn : site.nameEn}
                  </div>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '6px' }}>{site.district}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '11px' }}>
                    <div><span style={{ color: '#888' }}>Area:</span> <strong>{site.areaHectares.toFixed(1)} ha</strong></div>
                    <div><span style={{ color: '#888' }}>Elev:</span> <strong>{site.elevationM} m</strong></div>
                    <div><span style={{ color: '#888' }}>Slope:</span> <strong>{site.slopeMaxDeg ?? '—'}°</strong></div>
                    <div><span style={{ color: '#888' }}>Juris:</span> <strong style={{ textTransform: 'capitalize' }}>{site.jurisdiction.replace(/_/g, ' ')}</strong></div>
                  </div>
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
                    {activeCases.length > 0 ? (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        {activeCases.length} active case{activeCases.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a' }}>No active cases</span>
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
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        {lang === 'en' ? 'View site details →' : 'সাইট বিস্তারিত দেখুন →'}
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

      {/* Overlay: Chattogram region label */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-md text-[10px] text-gray-700 border border-gray-300 shadow-sm pointer-events-none">
        <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
        <span className="font-medium">Chattogram, Bangladesh</span>
        <span className="text-gray-400">·</span>
        <span className="font-mono text-gray-500">OpenStreetMap</span>
      </div>
    </div>
  )
}
