import { Bike, MapPin, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Coordinates } from '@/types'

interface Props {
  restaurant: Coordinates
  destination: Coordinates
  rider?: Coordinates
}

/**
 * Schematic map: the three points are fitted into the box and connected, without
 * map tiles (no map provider in this frontend-only build). Markers glide between
 * updates so movement reads as live.
 */
export function RiderMap({ restaurant, destination, rider }: Props) {
  const { t } = useTranslation()
  const points = [restaurant, destination, ...(rider ? [rider] : [])]
  const minLat = Math.min(...points.map((p) => p.lat))
  const maxLat = Math.max(...points.map((p) => p.lat))
  const minLng = Math.min(...points.map((p) => p.lng))
  const maxLng = Math.max(...points.map((p) => p.lng))
  const pad = 14 // percent of the box kept clear around the markers
  const place = (p: Coordinates) => ({
    x: pad + ((p.lng - minLng) / (maxLng - minLng || 1)) * (100 - 2 * pad),
    // Latitude grows northwards, screen y grows downwards.
    y: pad + ((maxLat - p.lat) / (maxLat - minLat || 1)) * (100 - 2 * pad),
  })
  const r = place(restaurant)
  const d = place(destination)
  const k = rider ? place(rider) : undefined

  return (
    <div role="img" aria-label={t('tracking.riderMap')} className="relative aspect-[16/7] overflow-hidden rounded-t-card bg-muted bg-[radial-gradient(circle,#d4d4d4_1px,transparent_1px)] bg-[length:16px_16px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <line x1={r.x} y1={r.y} x2={d.x} y2={d.y} stroke="#a3a3a3" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        {k && <line x1={k.x} y1={k.y} x2={d.x} y2={d.y} stroke="#0a0a0a" strokeWidth="3" vectorEffect="non-scaling-stroke" className="transition-all duration-1000" />}
      </svg>
      <Marker at={r} label={t('tracking.mapRestaurant')}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-surface">
          <Store className="h-4 w-4" />
        </span>
      </Marker>
      <Marker at={d} label={t('tracking.mapYou')}>
        <MapPin className="h-8 w-8 fill-ink text-surface" />
      </Marker>
      {k && (
        <Marker at={k}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-fg shadow-lg ring-4 ring-surface">
            <Bike className="h-5 w-5" />
          </span>
        </Marker>
      )}
      <span className="absolute right-2 bottom-2 rounded bg-surface/80 px-1.5 text-[10px] text-ink-soft">{t('tracking.mapNote')}</span>
    </div>
  )
}

function Marker({ at, label, children }: { at: { x: number; y: number }; label?: string; children: React.ReactNode }) {
  return (
    <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-all duration-1000 ease-linear motion-reduce:transition-none" style={{ left: `${at.x}%`, top: `${at.y}%` }} aria-hidden="true">
      {children}
      {label && <span className="mt-0.5 rounded bg-surface px-1 text-[10px] font-semibold shadow">{label}</span>}
    </div>
  )
}
