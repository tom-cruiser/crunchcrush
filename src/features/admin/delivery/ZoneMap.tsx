import type { DeliveryZone } from '@/types'

/** Schematic of the circular zones around the restaurant (not to map scale). */
export function ZoneMap({ zones }: { zones: DeliveryZone[] }) {
  const max = Math.max(1, ...zones.map((z) => z.radiusKm))
  const sorted = [...zones].sort((a, b) => b.radiusKm - a.radiusKm)
  const shades = ['#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373']
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Delivery zones around the restaurant" className="mx-auto w-full max-w-64">
      {sorted.map((z, i) => {
        const r = (z.radiusKm / max) * 92
        return (
          <g key={z.id} opacity={z.isActive ? 1 : 0.35}>
            <circle cx="100" cy="100" r={r} fill={shades[(sorted.length - 1 - i) % shades.length]} stroke="#171717" strokeWidth="1" strokeDasharray={z.isActive ? undefined : '4 3'} />
            <text x="100" y={100 - r + 11} textAnchor="middle" fontSize="9" fontWeight="700" fill="#171717">
              {z.radiusKm} km
            </text>
          </g>
        )
      })}
      <circle cx="100" cy="100" r="5" fill="#000" />
      <circle cx="100" cy="100" r="9" fill="none" stroke="#000" strokeWidth="1.5" />
    </svg>
  )
}
