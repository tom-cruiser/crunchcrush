import { useState } from 'react'
import { Plus, Search, ShoppingBag } from 'lucide-react'
import { menuApi, ordersApi, resetDemoData } from '@/api'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ErrorState, Input, Modal, Select, Skeleton, SkeletonList, Textarea } from '@/components/ui'
import { formatDate, formatDateTime, formatMoney, formatPhone, formatRelative } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { toast } from '@/store/toast'
import type { OrderStatus } from '@/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">{title}</h2>
      </CardHeader>
      <CardBody className="flex flex-wrap items-start gap-3">{children}</CardBody>
    </Card>
  )
}

function MockApiCheck() {
  const menu = useAsync(() => menuApi.getMenu(), [])
  const orders = useAsync(() => ordersApi.listOrders(), [])
  if (menu.error) return <ErrorState error={menu.error} onRetry={menu.reload} />
  if (menu.loading || orders.loading || !menu.data || !orders.data) return <SkeletonList rows={2} className="w-full" />
  const byStatus = orders.data.reduce<Partial<Record<OrderStatus, number>>>((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }), {})
  return (
    <div className="w-full text-sm">
      <p>
        <strong>{menu.data.categories.length}</strong> categories, <strong>{menu.data.items.length}</strong> items,{' '}
        <strong>{menu.data.items.filter((i) => !i.isAvailable).length}</strong> sold out,{' '}
        <strong>{menu.data.items.filter((i) => i.options.length || i.addOns.length).length}</strong> with options or add-ons.
      </p>
      <p className="mt-2">
        <strong>{orders.data.length}</strong> orders:
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {Object.entries(byStatus).map(([s, n]) => (
          <Badge key={s} tone="outline">
            {s}: {n}
          </Badge>
        ))}
      </div>
      <Button
        className="mt-3"
        size="sm"
        variant="outline"
        onClick={() => {
          resetDemoData()
          void menu.reload()
          void orders.reload()
          toast.success('Demo data reset')
        }}
      >
        Reset demo data
      </Button>
    </div>
  )
}

export default function UiKitPage() {
  const [modal, setModal] = useState<'auto' | 'center' | null>(null)
  const now = new Date().toISOString()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">UI kit</h1>

      <Section title="Mock API">
        <MockApiCheck />
      </Section>

      <Section title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Small
        </Button>
        <Button size="lg" rightIcon={<ShoppingBag className="h-5 w-5" />}>
          Large
        </Button>
        <Button size="icon" variant="secondary" aria-label="Add">
          <Plus className="h-5 w-5" />
        </Button>
      </Section>

      <Section title="Inputs">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Input label="Phone number" placeholder="078 123 4567" hint="We’ll text you a code" inputMode="tel" />
          <Input label="Search" leftIcon={<Search className="h-4 w-4" />} placeholder="Tacos, roll-eggs…" />
          <Input label="With error" defaultValue="abc" error="Enter a valid email" />
          <Select label="Fulfilment" defaultValue="delivery">
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </Select>
          <Textarea label="Note for the kitchen" placeholder="No onions please" className="sm:col-span-2" />
        </div>
      </Section>

      <Section title="Badges">
        <Badge>Neutral</Badge>
        <Badge tone="dark">Popular</Badge>
        <Badge tone="success">Delivered</Badge>
        <Badge tone="warning">Preparing</Badge>
        <Badge tone="danger">Sold out</Badge>
        <Badge tone="info">Out for delivery</Badge>
        <Badge tone="outline">Vegan</Badge>
      </Section>

      <Section title="Modal / bottom sheet">
        <Button variant="outline" onClick={() => setModal('auto')}>
          Bottom sheet (mobile) / dialog (desktop)
        </Button>
        <Button variant="outline" onClick={() => setModal('center')}>
          Centred dialog
        </Button>
        <Modal
          open={modal !== null}
          onClose={() => setModal(null)}
          variant={modal ?? 'auto'}
          title="Beef Birria Tacos"
          footer={
            <Button fullWidth onClick={() => setModal(null)}>
              Add to cart · {formatMoney(6500)}
            </Button>
          }
        >
          <p className="text-ink-soft">Slow-braised beef, melted cheese and a cup of consommé for dipping. Press Esc, tap the backdrop or the close button to dismiss.</p>
        </Modal>
      </Section>

      <Section title="Toasts">
        <Button variant="outline" onClick={() => toast.show('Added to cart', 'Beef Birria Tacos × 1')}>
          Default
        </Button>
        <Button variant="outline" onClick={() => toast.success('Payment received')}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.error('Payment failed', 'The payment was declined or timed out.')}>
          Error
        </Button>
        <Button variant="outline" onClick={() => toast.info('Your order is being prepared')}>
          Info
        </Button>
      </Section>

      <Section title="Skeletons">
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-6 w-1/3" />
          <SkeletonList rows={2} />
        </div>
      </Section>

      <Section title="Empty and error states">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Card>
            <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Your cart is empty" description="Add something tasty from the menu." action={<Button size="sm">Browse menu</Button>} />
          </Card>
          <Card>
            <ErrorState error={new Error('Could not load orders.')} onRetry={() => toast.info('Retrying…')} />
          </Card>
        </div>
      </Section>

      <Section title="Formatting">
        <dl className="grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-soft">Money</dt>
          <dd>{formatMoney(32000)}</dd>
          <dt className="text-ink-soft">Date</dt>
          <dd>{formatDate(now)}</dd>
          <dt className="text-ink-soft">Date and time</dt>
          <dd>{formatDateTime(now)}</dd>
          <dt className="text-ink-soft">Relative</dt>
          <dd>{formatRelative(new Date(Date.now() - 5 * 60_000).toISOString())}</dd>
          <dt className="text-ink-soft">Phone</dt>
          <dd>{formatPhone('+250788123456')}</dd>
        </dl>
      </Section>
    </div>
  )
}
