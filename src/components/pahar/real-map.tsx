'use client'

// PaharPahara — Real interactive map wrapper.
// Uses next/dynamic to load the Leaflet map client-side only (avoids SSR window issue).

import dynamic from 'next/dynamic'
import type { SiteDTO, BulletinDTO, CaseDTO } from '@/lib/types/dto'
import type { Lang } from '@/lib/i18n'

const RealMapInner = dynamic(
  () => import('./real-map-inner').then((m) => m.RealMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-lg border border-border bg-muted/30 flex items-center justify-center" style={{ height: 380 }}>
        <div className="text-xs text-muted-foreground animate-pulse">Loading map…</div>
      </div>
    ),
  },
)

interface Props {
  sites: SiteDTO[]
  bulletins: BulletinDTO[]
  cases?: CaseDTO[]
  lang: Lang
  selectedSiteId?: string
  onSelectSite?: (slug: string) => void
  height?: number
  enableScrollZoom?: boolean
}

export function RealMap(props: Props) {
  return <RealMapInner {...props} />
}
