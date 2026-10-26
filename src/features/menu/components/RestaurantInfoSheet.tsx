import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { settingsApi } from '@/api'
import { ButtonAnchor, Modal, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney, formatPhone } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { DAYS } from '@/features/store/hours'
import type { RestaurantSettings } from '@/types'

const WEEK = [...DAYS.slice(1), DAYS[0]]

export function RestaurantInfoSheet({ open, onClose, settings }: { open: boolean; onClose: () => void; settings: RestaurantSettings }) {
  const { t } = useTranslation()
  const zones = useAsync(() => settingsApi.getDeliveryZones(), [], 'zones')
  const today = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kigali', weekday: 'short' }).format(new Date()).toLowerCase().slice(0, 3)
  const upcoming = settings.holidayClosures.filter((h) => h.date >= new Date().toISOString().slice(0, 10))
  const { address } = settings

  return (
    <Modal open={open} onClose={onClose} title={settings.name}>
      <div className="flex flex-col gap-6 text-sm">
        <section>
          {/* Placeholder until a maps provider is chosen. */}
          <div className="flex aspect-[16/7] items-center justify-center rounded-xl bg-muted text-ink-soft" role="img" aria-label={t('restaurant.mapPlaceholder')}>
            <MapPin className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-3 font-semibold">{t('restaurant.address')}</p>
          <p className="text-ink-soft">
            {address.street}, {address.area}, {address.city}
          </p>
          <div className="mt-3 flex gap-2">
            <ButtonAnchor href={`tel:${settings.phone}`} className="flex-1" variant="outline" fullWidth leftIcon={<Phone className="h-4 w-4" />}>
                {t('restaurant.call')}
              </ButtonAnchor>
            {settings.whatsapp && (
              <ButtonAnchor href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1" variant="outline" fullWidth leftIcon={<MessageCircle className="h-4 w-4" />}>
                  {t('restaurant.whatsapp')}
                </ButtonAnchor>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-ink-soft">{formatPhone(settings.phone)}</p>
        </section>

        <section>
          <h3 className="mb-2 font-bold">{t('restaurant.hours')}</h3>
          <table className="w-full">
            <tbody>
              {WEEK.map((day) => {
                const h = settings.openingHours.find((o) => o.day === day)
                return (
                  <tr key={day} className={cn(day === today && 'font-bold')}>
                    <th scope="row" className="py-1 text-left font-[inherit]">
                      {t(`days.${day}`)}
                      {day === today && <span className="sr-only"> ({t('restaurant.today')})</span>}
                    </th>
                    <td className="py-1 text-right tabular-nums">{!h || h.closed ? t('restaurant.closedDay') : `${h.open}–${h.close}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {upcoming.length > 0 && (
            <div className="mt-3 rounded-xl bg-muted p-3">
              <p className="font-semibold">{t('restaurant.holidays')}</p>
              <ul className="mt-1 text-ink-soft">
                {upcoming.map((h) => (
                  <li key={h.id}>
                    {formatDate(`${h.date}T12:00:00Z`, { day: 'numeric', month: 'long' })}: {h.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-bold">{t('restaurant.deliveryZones')}</h3>
          {zones.loading && !zones.data ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {zones.data
                ?.filter((z) => z.isActive)
                .map((z) => (
                  <li key={z.id} className="flex justify-between gap-3 py-2">
                    <span>
                      {z.name}
                      <span className="block text-xs text-ink-soft">
                        ~{z.estimatedMinutes} min · {t('restaurant.minOrder', { amount: formatMoney(z.minOrder) })}
                      </span>
                    </span>
                    <span className="font-semibold whitespace-nowrap">{t('restaurant.deliveryFee', { fee: formatMoney(z.fee) })}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-bold">{t('restaurant.payments')}</h3>
          <p className="text-ink-soft">{settings.enabledPaymentMethods.map((m) => t(`payment.${m}`)).join(' · ')}</p>
          <p className="mt-1 text-ink-soft">{t('restaurant.minOrder', { amount: formatMoney(settings.minimumOrder) })}</p>
        </section>
      </div>
    </Modal>
  )
}
