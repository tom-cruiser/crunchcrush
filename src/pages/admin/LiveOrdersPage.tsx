import { useMemo, useState } from 'react'
import { Bell, BellOff, ClipboardList, Search } from 'lucide-react'
import { ordersApi, settingsApi } from '@/api'
import { Badge, Button, Card, EmptyState, ErrorState, Input, Select, SkeletonList, Switch } from '@/components/ui'
import { AdminOrderCard } from '@/features/admin/orders/AdminOrderCard'
import { OrderDetailSheet } from '@/features/admin/orders/OrderDetailSheet'
import { audioUnlocked, playNewOrderChime, unlockAudio } from '@/features/admin/orders/sound'
import { useLiveOrders } from '@/features/admin/orders/useLiveOrders'
import { Can } from '@/features/auth/RequireStaff'
import { can } from '@/features/auth/permissions'
import { useSettings } from '@/features/store/useSettings'
import { cn } from '@/lib/cn'
import { useAsync } from '@/lib/useAsync'
import { useAuth } from '@/store/auth'
import { usePreferences } from '@/store/preferences'
import { toast } from '@/store/toast'
import type { FulfillmentType, Order, OrderStatus } from '@/types'

const COLUMNS: { key: string; title: string; statuses: OrderStatus[] }[] = [
  { key: 'new', title: 'New', statuses: ['received'] },
  { key: 'kitchen', title: 'In the kitchen', statuses: ['accepted', 'preparing'] },
  { key: 'ready', title: 'Ready', statuses: ['ready'] },
  { key: 'road', title: 'On the road', statuses: ['out_for_delivery'] },
  { key: 'done', title: 'Done today', statuses: ['delivered', 'rejected', 'cancelled'] },
]

/** Oldest first so the kitchen works in order; scheduled orders sort by their slot. */
const queueTime = (o: Order) => o.scheduledFor ?? o.createdAt

export default function LiveOrdersPage() {
  const { orders, error, reload, replace } = useLiveOrders()
  const settings = useSettings()
  const role = useAuth((s) => s.staff?.role)
  const { soundAlerts, setSoundAlerts } = usePreferences()
  const [soundReady, setSoundReady] = useState(audioUnlocked())
  const simulation = useAsync(() => ordersApi.getSimulationEnabled(), [], 'simulation')
  const [selectedId, setSelectedId] = useState<string>()
  const [tab, setTab] = useState('new')
  const [fulfillment, setFulfillment] = useState<FulfillmentType | ''>('')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (orders ?? []).filter((o) => (!fulfillment || o.fulfillment === fulfillment) && (!q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)))
  }, [orders, fulfillment, query])

  const columns = COLUMNS.map((c) => ({
    ...c,
    orders: filtered
      .filter((o) => c.statuses.includes(o.status))
      .sort((a, b) => (c.key === 'done' ? b.updatedAt.localeCompare(a.updatedAt) : queueTime(a).localeCompare(queueTime(b)))),
  }))
  const selected = orders?.find((o) => o.id === selectedId)

  const toggleSettings = async (patch: { busyMode?: boolean; isOpen?: boolean }) => {
    try {
      settings.setData(await settingsApi.updateSettings(patch))
      if (patch.busyMode !== undefined) toast.show(patch.busyMode ? 'Busy mode on: customers see longer wait times' : 'Busy mode off')
      if (patch.isOpen !== undefined) toast.show(patch.isOpen ? 'Store is open' : 'Store is closed: only scheduled orders allowed')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const enableSound = async () => {
    const ok = await unlockAudio()
    setSoundReady(ok)
    setSoundAlerts(true)
    if (ok) playNewOrderChime()
  }

  if (error && !orders) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">Live orders</h1>
        {columns[0].orders.length > 0 && <Badge tone="danger">{columns[0].orders.length} new</Badge>}
        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
          {soundAlerts && soundReady ? (
            <Button size="sm" variant="ghost" leftIcon={<Bell className="h-4 w-4" />} onClick={() => setSoundAlerts(false)}>
              Sound on
            </Button>
          ) : (
            <Button size="sm" variant="outline" leftIcon={<BellOff className="h-4 w-4" />} onClick={enableSound}>
              Enable sound
            </Button>
          )}
          {settings.data && (
            <>
              <Can permission="orders.manage">
                <Switch size="sm" label="Busy mode" description={`+${settings.data.busyExtraMinutes} min`} checked={settings.data.busyMode} onChange={(busyMode) => toggleSettings({ busyMode })} />
              </Can>
              <Can permission="settings.manage">
                <Switch size="sm" label={settings.data.isOpen ? 'Open' : 'Closed'} checked={settings.data.isOpen} onChange={(isOpen) => toggleSettings({ isOpen })} />
              </Can>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Input aria-label="Search orders" placeholder="Order number or customer" leftIcon={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select aria-label="Filter by fulfilment" value={fulfillment} onChange={(e) => setFulfillment(e.target.value as FulfillmentType | '')} className="w-40">
          <option value="">All types</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
          <option value="dine-in">Dine-in</option>
        </Select>
        <Can permission="settings.manage">
          <Switch
            size="sm"
            label="Demo: auto-advance"
            description="Customer orders move on their own"
            checked={simulation.data ?? true}
            onChange={async (on) => simulation.setData(await ordersApi.setSimulationEnabled(on))}
          />
        </Can>
      </div>

      {/* Phones and tablets: one column at a time. */}
      <div role="tablist" aria-label="Order columns" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 xl:hidden">
        {columns.map((c) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={tab === c.key}
            onClick={() => setTab(c.key)}
            className={cn('flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold', tab === c.key ? 'bg-brand text-brand-fg' : 'bg-surface text-ink-soft ring-1 ring-line')}
          >
            {c.title}
            <span className={cn('rounded-full px-1.5 text-xs', tab === c.key ? 'bg-surface text-ink' : 'bg-muted')}>{c.orders.length}</span>
          </button>
        ))}
      </div>

      {!orders ? (
        <SkeletonList rows={4} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {columns.map((c) => (
            <section key={c.key} aria-labelledby={`col-${c.key}`} className={cn('flex flex-col gap-3', tab !== c.key && 'hidden xl:flex')}>
              <h2 id={`col-${c.key}`} className="hidden items-center gap-2 font-bold xl:flex">
                {c.title} <span className="rounded-full bg-surface px-2 text-xs ring-1 ring-line">{c.orders.length}</span>
              </h2>
              {c.orders.length === 0 ? (
                <Card className="border-dashed bg-transparent">
                  <EmptyState className="py-8" icon={<ClipboardList className="h-5 w-5" />} title="Nothing here" />
                </Card>
              ) : (
                c.orders.map((o) => <AdminOrderCard key={o.id} order={o} onOpen={() => setSelectedId(o.id)} showPrices={can(role, 'customers.view')} />)
              )}
            </section>
          ))}
        </div>
      )}

      {settings.data && <OrderDetailSheet order={selected} settings={settings.data} onClose={() => setSelectedId(undefined)} onUpdated={replace} />}
    </div>
  )
}
