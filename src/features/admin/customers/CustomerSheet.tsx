import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { ordersApi } from '@/api'
import type { CustomerSummary } from '@/api/customers'
import { Card, ErrorState, Modal, SkeletonList } from '@/components/ui'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { formatDate, formatDateTime, formatMoney, formatPhone } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

export function CustomerSheet({ customer, onClose }: { customer: CustomerSummary; onClose: () => void }) {
  const orders = useAsync(() => ordersApi.listCustomerOrders(customer.id), [customer.id])
  const waNumber = customer.phone.replace(/\D/g, '')
  return (
    <Modal open onClose={onClose} title={customer.name} size="lg">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Figure label="Orders" value={String(customer.orderCount)} />
          <Figure label="Spent" value={formatMoney(customer.totalSpent)} />
          <Figure label="Customer since" value={formatDate(customer.createdAt, { month: 'short', year: 'numeric' })} />
        </div>

        <div className="flex flex-wrap gap-2">
          <ContactLink href={`tel:${customer.phone}`} icon={<Phone className="h-4 w-4" />} label={formatPhone(customer.phone)} />
          <ContactLink href={`https://wa.me/${waNumber}`} icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" external />
          {customer.email && <ContactLink href={`mailto:${customer.email}`} icon={<Mail className="h-4 w-4" />} label={customer.email} />}
        </div>

        {customer.addresses.length > 0 && (
          <section>
            <h3 className="mb-2 font-bold">Saved addresses</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {customer.addresses.map((a) => (
                <li key={a.id} className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  <span>
                    <span className="font-semibold">{a.label}</span> · {a.street}, {a.area}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="mb-2 font-bold">Orders</h3>
          {orders.error && !orders.data ? (
            <ErrorState error={orders.error} onRetry={orders.reload} />
          ) : !orders.data ? (
            <SkeletonList rows={3} />
          ) : orders.data.length === 0 ? (
            <p className="text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <Card>
              <ul className="divide-y divide-line text-sm">
                {orders.data.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {o.orderNumber} <span className="font-normal text-ink-soft">· {formatDateTime(o.createdAt)}</span>
                      </p>
                      <p className="truncate text-ink-soft">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                    </div>
                    <span className="shrink-0 font-semibold">{formatMoney(o.pricing.total)}</span>
                    <OrderStatusBadge status={o.status} fulfillment={o.fulfillment} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </Modal>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  )
}

function ContactLink({ href, icon, label, external }: { href: string; icon: React.ReactNode; label: string; external?: boolean }) {
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:bg-muted">
      {icon}
      {label}
    </a>
  )
}
