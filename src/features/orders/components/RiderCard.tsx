import { useEffect } from 'react'
import { Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ordersApi } from '@/api'
import { ButtonAnchor, Card, CardBody, Skeleton } from '@/components/ui'
import { useSettings } from '@/features/store/useSettings'
import { distanceKm } from '@/lib/geo'
import { formatPhone } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import type { Coordinates } from '@/types'
import { RiderMap } from './RiderMap'

const REFRESH_MS = 15_000

/** Rider details with a live position map while the order is on the road. */
export function RiderCard({ orderId, destination }: { orderId: string; destination?: Coordinates }) {
  const { t } = useTranslation()
  const settings = useSettings()
  const rider = useAsync(() => ordersApi.getOrderRider(orderId), [orderId])
  const { reload } = rider

  useEffect(() => {
    const id = window.setInterval(reload, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [reload])

  const location = rider.data?.currentLocation
  const km = location && destination ? distanceKm(location, destination) : undefined
  return (
    <Card>
      {destination && settings.data && <RiderMap restaurant={settings.data.address.coordinates} destination={destination} rider={location} />}
      {destination && (
        <p className="border-b border-line px-4 py-2 text-sm font-semibold" aria-live="polite">
          {km === undefined ? t('tracking.locationPending') : km < 0.3 ? t('tracking.almostThere') : t('tracking.kmAway', { km: km.toFixed(1) })}
        </p>
      )}
      <CardBody className="flex items-center gap-3">
        {rider.loading && !rider.data ? (
          <Skeleton className="h-10 w-full" />
        ) : rider.data ? (
          <>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted font-bold">{rider.data.name.charAt(0)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-soft">{t('tracking.rider')}</p>
              <p className="truncate font-bold">{rider.data.name}</p>
              <p className="text-xs text-ink-soft">
                {rider.data.vehicle} {rider.data.plateNumber && `· ${rider.data.plateNumber}`}
              </p>
            </div>
            <ButtonAnchor href={`tel:${rider.data.phone}`} aria-label={`${t('tracking.callRider')} ${formatPhone(rider.data.phone)}`} size="icon" variant="secondary">
                <Phone className="h-5 w-5" aria-hidden="true" />
              </ButtonAnchor>
          </>
        ) : null}
      </CardBody>
    </Card>
  )
}
