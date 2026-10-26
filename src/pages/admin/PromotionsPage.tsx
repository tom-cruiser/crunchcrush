import { useState } from 'react'
import { Pencil, Plus, Tag, Trash2, UtensilsCrossed } from 'lucide-react'
import { menuApi, promotionsApi } from '@/api'
import { Badge, Button, Card, EmptyState, ErrorState, Modal, SkeletonList, Switch } from '@/components/ui'
import { ComboEditor } from '@/features/admin/promotions/ComboEditor'
import { PromoEditor } from '@/features/admin/promotions/PromoEditor'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { toast } from '@/store/toast'
import type { ComboDeal, PromoCode } from '@/types'

type PromoState = 'live' | 'scheduled' | 'expired' | 'used_up' | 'paused'
const STATE: Record<PromoState, { label: string; tone: 'success' | 'info' | 'neutral' | 'warning' | 'outline' }> = {
  live: { label: 'Live', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  expired: { label: 'Expired', tone: 'neutral' },
  used_up: { label: 'Used up', tone: 'warning' },
  paused: { label: 'Paused', tone: 'outline' },
}

function promoState(p: PromoCode, now = new Date().toISOString()): PromoState {
  if (!p.isActive) return 'paused'
  if (now > p.validTo) return 'expired'
  if (p.usageLimit !== undefined && p.usedCount >= p.usageLimit) return 'used_up'
  if (now < p.validFrom) return 'scheduled'
  return 'live'
}

function describeDiscount(p: PromoCode) {
  if (p.type === 'free_delivery') return 'Free delivery'
  if (p.type === 'fixed') return `${formatMoney(p.value)} off`
  return `${p.value}% off${p.maxDiscount ? ` (max ${formatMoney(p.maxDiscount)})` : ''}`
}

export default function PromotionsPage() {
  const [tab, setTab] = useState<'codes' | 'combos'>('codes')
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Promotions</h1>
      <div role="tablist" className="flex gap-2">
        {(
          [
            ['codes', 'Promo codes'],
            ['combos', 'Combo deals'],
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
      {tab === 'codes' ? <PromoCodes /> : <Combos />}
    </div>
  )
}

function PromoCodes() {
  const promos = useAsync(() => promotionsApi.listPromoCodes(), [], 'admin-promos')
  const [editing, setEditing] = useState<PromoCode | 'new'>()
  const [deleting, setDeleting] = useState<PromoCode>()
  const list = promos.data ?? []
  const upsert = (p: PromoCode) => promos.setData(list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list])

  const toggle = async (p: PromoCode, isActive: boolean) => {
    try {
      upsert(await promotionsApi.savePromoCode({ ...p, isActive }))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }
  const remove = async () => {
    if (!deleting) return
    try {
      await promotionsApi.deletePromoCode(deleting.id)
      promos.setData(list.filter((p) => p.id !== deleting.id))
      toast.success(`${deleting.code} deleted`)
      setDeleting(undefined)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (promos.error && !promos.data) return <ErrorState error={promos.error} onRetry={promos.reload} />
  if (!promos.data) return <SkeletonList rows={4} />
  return (
    <>
      <div className="flex">
        <Button size="sm" className="ml-auto" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
          Promo code
        </Button>
      </div>
      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<Tag className="h-6 w-6" />} title="No promo codes" description="Create a code customers can enter at checkout." action={<Button onClick={() => setEditing('new')}>Create code</Button>} />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {list.map((p) => {
              const state = promoState(p)
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded-lg bg-muted px-2 py-0.5 font-mono text-sm font-bold">{p.code}</code>
                      <Badge tone={STATE[state].tone}>{STATE[state].label}</Badge>
                    </div>
                    <p className="mt-1 text-sm">
                      {describeDiscount(p)}
                      {p.minOrder > 0 && <span className="text-ink-soft"> · orders over {formatMoney(p.minOrder)}</span>}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {formatDate(p.validFrom)} – {formatDate(p.validTo)} · used {p.usedCount}
                      {p.usageLimit !== undefined && ` of ${p.usageLimit}`} times
                    </p>
                  </div>
                  <Switch size="sm" hideLabel label={`${p.code} active`} checked={p.isActive} onChange={(on) => toggle(p, on)} />
                  <div className="flex">
                    <button type="button" aria-label={`Edit ${p.code}`} onClick={() => setEditing(p)} className="rounded-full p-2 hover:bg-muted">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label={`Delete ${p.code}`} onClick={() => setDeleting(p)} className="rounded-full p-2 hover:bg-muted">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
      {editing && <PromoEditor promo={editing === 'new' ? undefined : editing} onClose={() => setEditing(undefined)} onSaved={upsert} />}
      <ConfirmDelete open={Boolean(deleting)} name={deleting?.code} onCancel={() => setDeleting(undefined)} onConfirm={remove} note="Customers who saved this code won’t be able to use it. To pause it, switch it off instead." />
    </>
  )
}

function Combos() {
  const combos = useAsync(() => promotionsApi.listCombos(), [], 'admin-combos')
  const menu = useAsync(() => menuApi.getAdminMenu(), [], 'admin-menu')
  const [editing, setEditing] = useState<ComboDeal | 'new'>()
  const [deleting, setDeleting] = useState<ComboDeal>()
  const list = combos.data ?? []
  const items = menu.data?.items ?? []
  const upsert = (c: ComboDeal) => combos.setData(list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c])

  const toggle = async (c: ComboDeal, isActive: boolean) => {
    try {
      upsert(await promotionsApi.saveCombo({ ...c, isActive }))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }
  const remove = async () => {
    if (!deleting) return
    try {
      await promotionsApi.deleteCombo(deleting.id)
      combos.setData(list.filter((c) => c.id !== deleting.id))
      toast.success(`${deleting.name} deleted`)
      setDeleting(undefined)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const error = combos.error ?? menu.error
  if (error && (!combos.data || !menu.data)) return <ErrorState error={error} onRetry={() => (combos.reload(), menu.reload())} />
  if (!combos.data || !menu.data) return <SkeletonList rows={3} />
  return (
    <>
      <div className="flex">
        <Button size="sm" className="ml-auto" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
          Combo
        </Button>
      </div>
      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<UtensilsCrossed className="h-6 w-6" />} title="No combo deals" description="Bundle items at a lower price." action={<Button onClick={() => setEditing('new')}>Create combo</Button>} />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((c) => {
            const names = c.itemIds.map((id) => items.find((i) => i.id === id)?.name ?? 'Deleted item')
            const regular = c.itemIds.reduce((s, id) => s + (items.find((i) => i.id === id)?.price ?? 0), 0)
            return (
              <Card key={c.id} className={cn('flex flex-col gap-2 p-4', !c.isActive && 'opacity-70')}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{c.name}</p>
                    <p className="text-sm text-ink-soft">{c.description}</p>
                  </div>
                  <Switch size="sm" hideLabel label={`${c.name} active`} checked={c.isActive} onChange={(on) => toggle(c, on)} />
                </div>
                <p className="text-sm">{names.join(' + ')}</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatMoney(c.price)}</span>
                  {regular > c.price && <span className="text-sm text-ink-soft line-through">{formatMoney(regular)}</span>}
                  <div className="ml-auto flex">
                    <button type="button" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)} className="rounded-full p-2 hover:bg-muted">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label={`Delete ${c.name}`} onClick={() => setDeleting(c)} className="rounded-full p-2 hover:bg-muted">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {editing && <ComboEditor combo={editing === 'new' ? undefined : editing} items={items} onClose={() => setEditing(undefined)} onSaved={upsert} />}
      <ConfirmDelete open={Boolean(deleting)} name={deleting?.name} onCancel={() => setDeleting(undefined)} onConfirm={remove} />
    </>
  )
}

function ConfirmDelete({ open, name, note, onCancel, onConfirm }: { open: boolean; name?: string; note?: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Delete?"
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={onConfirm}>
            Delete
          </Button>
        </div>
      }
    >
      <p className="text-ink-soft">
        Delete “{name}”? {note}
      </p>
    </Modal>
  )
}
