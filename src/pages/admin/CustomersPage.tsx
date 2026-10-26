import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquareWarning, Search, Users } from 'lucide-react'
import { customersApi } from '@/api'
import type { CustomerSummary, FeedbackEntry } from '@/api/customers'
import { Badge, Card, EmptyState, ErrorState, Input, Select, SkeletonList, Switch } from '@/components/ui'
import { CustomerSheet } from '@/features/admin/customers/CustomerSheet'
import { StarDisplay } from '@/features/orders/components/StarRating'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney, formatPhone, formatRelative } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { toast } from '@/store/toast'

export default function CustomersPage() {
  const [tab, setTab] = useState<'customers' | 'feedback'>('customers')
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Customers</h1>
      <div role="tablist" className="flex gap-2">
        {(
          [
            ['customers', 'Customers'],
            ['feedback', 'Ratings and problems'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn('rounded-full px-4 py-2 text-sm font-semibold', tab === key ? 'bg-brand text-brand-fg' : 'bg-surface hover:bg-muted')}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'customers' ? <CustomerList /> : <Feedback />}
    </div>
  )
}

type Sort = 'spent' | 'orders' | 'recent'

function CustomerList() {
  const customers = useAsync(() => customersApi.listCustomers(), [], 'admin-customers')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('spent')
  const [open, setOpen] = useState<CustomerSummary>()

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    return (customers.data ?? [])
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || (digits.length >= 3 && c.phone.includes(digits)))
      .sort((a, b) => (sort === 'spent' ? b.totalSpent - a.totalSpent : sort === 'orders' ? b.orderCount - a.orderCount : (b.lastOrderAt ?? '').localeCompare(a.lastOrderAt ?? '')))
  }, [customers.data, query, sort])

  if (customers.error && !customers.data) return <ErrorState error={customers.error} onRetry={customers.reload} />
  if (!customers.data) return <SkeletonList rows={5} />
  return (
    <>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input aria-label="Search customers" placeholder="Name, phone or email" leftIcon={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-40">
          <option value="spent">Top spenders</option>
          <option value="orders">Most orders</option>
          <option value="recent">Recent</option>
        </Select>
      </div>
      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-6 w-6" />} title="No customers found" description={query ? 'Try another search.' : 'Customers appear here after they sign in and order.'} />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {visible.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setOpen(c)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{c.name}</p>
                    <p className="truncate text-sm text-ink-soft">
                      {formatPhone(c.phone)}
                      {c.email && ` · ${c.email}`}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{formatMoney(c.totalSpent)}</p>
                    <p className="text-ink-soft">
                      {c.orderCount} orders{c.lastOrderAt && ` · ${formatRelative(c.lastOrderAt)}`}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {open && <CustomerSheet customer={open} onClose={() => setOpen(undefined)} />}
    </>
  )
}

type FeedbackFilter = 'all' | 'open' | 'low'

function Feedback() {
  const { t } = useTranslation()
  const feedback = useAsync(() => customersApi.listFeedback(), [], 'admin-feedback')
  const [filter, setFilter] = useState<FeedbackFilter>('open')
  const list = feedback.data ?? []

  const rated = list.filter((f) => f.rating)
  const avg = (pick: (f: FeedbackEntry) => number | undefined) => {
    const values = rated.map(pick).filter((v): v is number => v !== undefined)
    return values.length ? (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1) : '–'
  }
  const openCount = list.reduce((n, f) => n + f.problems.filter((p) => !p.resolved).length, 0)
  const visible = list.filter((f) => (filter === 'open' ? f.problems.some((p) => !p.resolved) : filter === 'low' ? (f.rating?.food ?? 5) <= 2 || (f.rating?.delivery ?? 5) <= 2 : true))

  const setResolved = async (entry: FeedbackEntry, problemId: string, resolved: boolean) => {
    try {
      const saved = await customersApi.setProblemResolved(entry.orderId, problemId, resolved)
      feedback.setData(list.map((f) => (f.orderId === entry.orderId ? { ...f, problems: f.problems.map((p) => (p.id === saved.id ? saved : p)) } : f)))
      toast.show(resolved ? 'Marked resolved' : 'Reopened')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (feedback.error && !feedback.data) return <ErrorState error={feedback.error} onRetry={feedback.reload} />
  if (!feedback.data) return <SkeletonList rows={5} />
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-sm text-ink-soft">Food rating</p>
          <p className="text-2xl font-extrabold">{avg((f) => f.rating?.food)}</p>
          <p className="text-xs text-ink-soft">{rated.length} ratings</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-ink-soft">Delivery rating</p>
          <p className="text-2xl font-extrabold">{avg((f) => f.rating?.delivery)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-ink-soft">Open problems</p>
          <p className="text-2xl font-extrabold">{openCount}</p>
        </Card>
      </div>
      <Select aria-label="Show" value={filter} onChange={(e) => setFilter(e.target.value as FeedbackFilter)} className="w-56">
        <option value="open">Open problems</option>
        <option value="low">Low ratings (1–2 stars)</option>
        <option value="all">All feedback</option>
      </Select>
      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={<MessageSquareWarning className="h-6 w-6" />} title={filter === 'open' ? 'No open problems' : 'Nothing here'} description={filter === 'open' ? 'Every reported problem has been handled.' : undefined} />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((f) => (
            <Card key={f.orderId} className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{f.customerName}</p>
                <span className="text-sm text-ink-soft">
                  {f.orderNumber} · {formatDate(f.createdAt)}
                </span>
              </div>
              {f.rating && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="flex items-center gap-1">
                    Food <StarDisplay value={f.rating.food} />
                  </span>
                  {f.rating.delivery !== undefined && (
                    <span className="flex items-center gap-1">
                      Delivery <StarDisplay value={f.rating.delivery} />
                    </span>
                  )}
                </div>
              )}
              {f.rating?.comment && <p className="text-sm">“{f.rating.comment}”</p>}
              {f.problems.map((p) => (
                <div key={p.id} className={cn('flex items-start gap-3 rounded-xl border p-3', p.resolved ? 'border-line' : 'border-warning bg-warning/5')}>
                  <div className="min-w-0 flex-1 text-sm">
                    <Badge tone={p.resolved ? 'neutral' : 'warning'}>{t(`rating.types.${p.type}`)}</Badge>
                    <p className="mt-1">{p.message}</p>
                  </div>
                  <Switch size="sm" label="Resolved" checked={p.resolved} onChange={(on) => setResolved(f, p.id, on)} />
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
