import { useEffect, useState } from 'react'
import { Check, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { placesApi, settingsApi } from '@/api'
import type { Place } from '@/api/places'
import type { ZoneCheck } from '@/api/settings'
import { Button, Input, Spinner } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import type { Address } from '@/types'
import { ChoiceCard } from './ChoiceCard'

export interface AddressDraft {
  address?: Address
  /** True for a new address the user may want saved to their account. */
  isNew: boolean
  save: boolean
}

interface AddressPickerProps {
  saved: Address[]
  canSave: boolean
  value: AddressDraft
  onChange: (draft: AddressDraft) => void
  zone?: ZoneCheck
  zoneLoading: boolean
  error?: string
}

/** Placeholder for a real map; shows the pin and the place name. */
function MapPreview({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={`Map preview: ${label}`}
      className="relative flex aspect-[16/7] items-center justify-center overflow-hidden rounded-xl bg-muted bg-[radial-gradient(circle,#d4d4d4_1px,transparent_1px)] bg-[length:16px_16px]"
    >
      <MapPin className="h-8 w-8 -translate-y-2 fill-ink text-surface" aria-hidden="true" />
      <span className="absolute bottom-2 left-2 rounded-lg bg-surface px-2 py-1 text-xs font-semibold shadow">{label}</span>
    </div>
  )
}

/** Area search or geolocation, then street and directions. Also used on the saved-addresses page. */
export function NewAddressForm({ value, onChange, showLabel, showSave }: { value: AddressDraft; onChange: (d: AddressDraft) => void; showLabel: boolean; showSave: boolean }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string>()
  const places = useAsync(() => placesApi.searchPlaces(query), [query])
  const address = value.address

  const pick = (place: Place) =>
    onChange({
      ...value,
      address: {
        id: address?.id ?? 'new',
        label: address?.label || 'Home',
        street: address?.street ?? '',
        area: place.area,
        city: place.city,
        instructions: address?.instructions,
        coordinates: place.coordinates,
      },
    })

  const locate = () => {
    if (!('geolocation' in navigator)) return setGeoError(t('checkout.locationDenied'))
    setLocating(true)
    setGeoError(undefined)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          pick(await placesApi.reverseGeocode({ lat: pos.coords.latitude, lng: pos.coords.longitude }))
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        setGeoError(t('checkout.locationDenied'))
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  const patch = (p: Partial<Address>) => address && onChange({ ...value, address: { ...address, ...p } })

  if (!address) {
    return (
      <div className="flex flex-col gap-3">
        <Input label={t('checkout.searchArea')} leftIcon={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kacyiru, Remera, Kigali Heights…" />
        <Button variant="outline" leftIcon={locating ? <Spinner className="h-4 w-4" /> : <LocateFixed className="h-4 w-4" />} onClick={locate} disabled={locating}>
          {locating ? t('checkout.locating') : t('checkout.useLocation')}
        </Button>
        {geoError && <p className="text-sm text-danger">{geoError}</p>}
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line" aria-label="Places" aria-busy={places.loading}>
          {places.data?.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => pick(p)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted">
                <MapPin className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
                <span>
                  <span className="block font-semibold">{p.name}</span>
                  <span className="block text-xs text-ink-soft">
                    {p.area}, {p.city}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {places.data?.length === 0 && <li className="px-3 py-3 text-sm text-ink-soft">No places found.</li>}
        </ul>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <MapPreview label={`${address.area}, ${address.city}`} />
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">
          {address.area}, {address.city}
        </span>
        <button type="button" className="font-semibold underline underline-offset-2" onClick={() => onChange({ ...value, address: undefined })}>
          {t('checkout.changeArea')}
        </button>
      </div>
      <Input label={t('checkout.street')} placeholder={t('checkout.streetPlaceholder')} value={address.street} onChange={(e) => patch({ street: e.target.value })} autoComplete="street-address" required />
      <Input label={t('checkout.instructions')} placeholder={t('checkout.instructionsPlaceholder')} value={address.instructions ?? ''} onChange={(e) => patch({ instructions: e.target.value })} />
      {showLabel && <Input label={t('checkout.label')} value={address.label} onChange={(e) => patch({ label: e.target.value })} placeholder="Home, Work…" />}
      {showSave && (
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={value.save} onChange={(e) => onChange({ ...value, save: e.target.checked })} className="h-5 w-5 accent-ink" />
          {t('checkout.saveAddress')}
        </label>
      )}
    </div>
  )
}

export function AddressPicker({ saved, canSave, value, onChange, zone, zoneLoading, error }: AddressPickerProps) {
  const { t } = useTranslation()
  const mode = value.isNew || saved.length === 0 ? 'new' : 'saved'

  return (
    <div className="flex flex-col gap-3">
      {saved.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-ink-soft">{t('checkout.savedAddresses')}</legend>
          {saved.map((a) => (
            <ChoiceCard
              key={a.id}
              name="saved-address"
              value={a.id}
              checked={mode === 'saved' && value.address?.id === a.id}
              onChange={() => onChange({ address: a, isNew: false, save: false })}
              icon={<MapPin className="h-4 w-4" />}
              title={a.label}
              description={`${a.street}, ${a.area}`}
            />
          ))}
          <ChoiceCard name="saved-address" value="new" checked={mode === 'new'} onChange={() => onChange({ address: undefined, isNew: true, save: true })} icon={<Search className="h-4 w-4" />} title={t('checkout.newAddress')} />
        </fieldset>
      )}

      {mode === 'new' && <NewAddressForm value={value} onChange={onChange} showLabel={canSave} showSave={canSave} />}

      {value.address && (
        <div aria-live="polite">
          {zoneLoading ? (
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <Spinner className="h-4 w-4" /> {t('checkout.checkingZone')}
            </p>
          ) : zone ? (
            <p className={cn('flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold', zone.deliverable ? 'bg-green-50 text-success' : 'bg-red-50 text-danger')}>
              {zone.deliverable ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span>
                {zone.deliverable && zone.zone
                  ? t('checkout.deliverable', { fee: formatMoney(zone.zone.fee), minutes: zone.zone.estimatedMinutes })
                  : t('checkout.notDeliverable', { area: value.address.area, km: zone.distanceKm })}
                {zone.zone && zone.zone.minOrder > 0 && <span className="block font-normal">{t('checkout.zoneMin', { amount: formatMoney(zone.zone.minOrder) })}</span>}
              </span>
            </p>
          ) : null}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** Runs the delivery-zone check whenever the chosen point changes. */
export function useZoneCheck(address?: Address) {
  const lat = address?.coordinates.lat
  const lng = address?.coordinates.lng
  const [state, setState] = useState<{ zone?: ZoneCheck; loading: boolean }>({ loading: false })
  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setState({ loading: false })
      return
    }
    let cancelled = false
    setState({ loading: true })
    settingsApi
      .checkDeliveryZone({ lat, lng })
      .then((zone) => !cancelled && setState({ zone, loading: false }))
      .catch(() => !cancelled && setState({ loading: false }))
    return () => {
      cancelled = true
    }
  }, [lat, lng])
  return state
}
