import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ordersApi } from '@/api'
import { Button, ErrorState, Spinner } from '@/components/ui'
import { describeCustomization } from '@/features/menu/customization'
import { useSettings } from '@/features/store/useSettings'
import { formatDateTime, formatMoney, formatPhone } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import type { Order, RestaurantSettings } from '@/types'
import i18n from '@/i18n'

const t = i18n.t.bind(i18n)

function KitchenTicket({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="border-b-2 border-dashed border-black pb-2 text-center">
        <p className="text-3xl font-black">{order.orderNumber}</p>
        <p className="text-lg font-bold uppercase">
          {t(`fulfillment.${order.fulfillment}`)}
        </p>
        <p>{formatDateTime(order.createdAt)}</p>
        {order.scheduledFor && <p className="mt-1 bg-black px-1 font-bold text-white">SCHEDULED {formatDateTime(order.scheduledFor)}</p>}
        <p className="mt-1">{order.customerName}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {order.items.map((line) => (
          <li key={line.lineId} className="border-b border-dotted border-black pb-2">
            <p className="text-lg font-bold">
              {line.quantity} × {line.name}
            </p>
            {line.selectedOptions.map((o) => (
              <p key={o.optionId} className="pl-4">
                {o.optionName}: {o.choiceNames.join(', ')}
              </p>
            ))}
            {line.selectedAddOns.map((a) => (
              <p key={a.addOnId} className="pl-4">
                + {a.quantity > 1 ? `${a.quantity}× ` : ''}
                {a.name}
              </p>
            ))}
            {line.removedIngredients.map((r) => (
              <p key={r} className="pl-4 font-bold">
                NO {r.toUpperCase()}
              </p>
            ))}
            {line.note && <p className="mt-1 pl-4 font-bold">NOTE: {line.note}</p>}
          </li>
        ))}
      </ul>
      <p className="text-center">Items: {order.items.reduce((n, i) => n + i.quantity, 0)}</p>
    </div>
  )
}

function Receipt({ order, settings }: { order: Order; settings: RestaurantSettings }) {
  const p = order.pricing
  const row = (label: string, value: string, bold = false) => (
    <div className={`flex justify-between ${bold ? 'text-base font-bold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
  return (
    <div className="flex flex-col gap-2">
      <div className="text-center">
        <p className="text-xl font-black">{settings.name.toUpperCase()}</p>
        <p>
          {settings.address.street}, {settings.address.area}, {settings.address.city}
        </p>
        <p>{formatPhone(settings.phone)}</p>
        <p>TIN: 000000000</p>
      </div>
      <div className="border-y border-dashed border-black py-1">
        {row('Order', order.orderNumber)}
        {row('Date', formatDateTime(order.createdAt))}
        {row('Type', t(`fulfillment.${order.fulfillment}`))}
        {row('Customer', order.customerName)}
      </div>
      <ul>
        {order.items.map((line) => (
          <li key={line.lineId} className="py-0.5">
            {row(`${line.quantity} × ${line.name}`, formatMoney(line.unitPrice * line.quantity))}
            {describeCustomization(line) && <p className="pl-3 text-[11px]">{describeCustomization(line)}</p>}
          </li>
        ))}
      </ul>
      <div className="border-t border-dashed border-black pt-1">
        {row('Subtotal', formatMoney(p.subtotal))}
        {p.deliveryFee > 0 && row('Delivery', formatMoney(p.deliveryFee))}
        {p.discount > 0 && row(`Discount${order.promoCode ? ` (${order.promoCode})` : ''}`, `-${formatMoney(p.discount)}`)}
        {row('TOTAL', formatMoney(p.total), true)}
        {row(settings.taxInclusive ? `incl. VAT ${settings.taxRatePercent}%` : `VAT ${settings.taxRatePercent}%`, formatMoney(p.tax))}
      </div>
      <div className="border-t border-dashed border-black pt-1">
        {row('Payment', t(`payment.${order.paymentMethod}`))}
        {row('Status', order.paymentStatus.toUpperCase())}
      </div>
      <p className="mt-2 text-center">Murakoze! Thank you for ordering.</p>
    </div>
  )
}

/** Standalone 80 mm page for thermal printers: /admin/print/:orderId?type=kitchen|receipt */
export default function PrintPage() {
  const { orderId = '' } = useParams()
  const [params] = useSearchParams()
  const type = params.get('type') === 'receipt' ? 'receipt' : 'kitchen'
  const order = useAsync(() => ordersApi.getOrder(orderId), [orderId])
  const { data: settings } = useSettings()
  const ready = Boolean(order.data && settings)

  useEffect(() => {
    if (!ready || params.get('autoprint') === '0') return
    const id = setTimeout(() => window.print(), 300)
    return () => clearTimeout(id)
  }, [ready, params])

  if (order.error) return <ErrorState error={order.error} onRetry={order.reload} />
  if (!order.data || !settings) return <Spinner label="Loading" className="m-8" />

  return (
    <div className="min-h-dvh bg-neutral-200 py-6 print:bg-white print:py-0">
      <style>{'@page { size: 80mm auto; margin: 4mm; }'}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[80mm] gap-2">
        <Button size="sm" onClick={() => window.print()}>
          Print
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.close()}>
          Close
        </Button>
      </div>
      <article className="mx-auto w-[80mm] bg-white p-3 font-mono text-xs leading-snug text-black shadow print:w-full print:p-0 print:shadow-none">
        {/* Kitchen staff get orders without prices from the server, so they can only print the ticket. */}
        {type === 'kitchen' || !order.data.pricing ? <KitchenTicket order={order.data} /> : <Receipt order={order.data} settings={settings} />}
      </article>
    </div>
  )
}
