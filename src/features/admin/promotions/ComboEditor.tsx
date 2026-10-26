import { useState } from 'react'
import { promotionsApi } from '@/api'
import { Button, Input, Modal, Switch, Textarea } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { toast } from '@/store/toast'
import type { ComboDeal, MenuItem } from '@/types'

interface Props {
  combo?: ComboDeal
  items: MenuItem[]
  onClose: () => void
  onSaved: (c: ComboDeal) => void
}

export function ComboEditor({ combo, items, onClose, onSaved }: Props) {
  const [name, setName] = useState(combo?.name ?? '')
  const [description, setDescription] = useState(combo?.description ?? '')
  const [itemIds, setItemIds] = useState<string[]>(combo?.itemIds ?? [])
  const [price, setPrice] = useState(combo ? String(combo.price) : '')
  const [isActive, setIsActive] = useState(combo?.isActive ?? true)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const regular = itemIds.reduce((sum, id) => sum + (items.find((i) => i.id === id)?.price ?? 0), 0)
  const priceNum = Number(price)
  const errors = {
    name: name.trim().length < 2 ? 'Name the combo' : undefined,
    items: itemIds.length < 2 ? 'Pick at least two items' : undefined,
    price: !price || !Number.isInteger(priceNum) || priceNum < 100 ? 'Enter a price' : priceNum >= regular ? 'Should be less than the items bought separately' : undefined,
  }
  const visible = items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))

  const save = async () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    setBusy(true)
    try {
      onSaved(await promotionsApi.saveCombo({ id: combo?.id, name: name.trim(), description: description.trim(), itemIds, price: priceNum, isActive }))
      toast.success('Combo saved')
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={combo ? 'Edit combo' : 'New combo deal'}
      size="lg"
      footer={
        <Button fullWidth loading={busy} onClick={save}>
          Save combo
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={submitted ? errors.name : undefined} />
        <Textarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Items ({itemIds.length} selected)</legend>
          <Input aria-label="Search items" placeholder="Search items" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul className="mt-2 max-h-56 divide-y divide-line overflow-y-auto rounded-xl border border-line">
            {visible.map((item) => {
              const on = itemIds.includes(item.id)
              return (
                <li key={item.id}>
                  <label className={cn('flex cursor-pointer items-center gap-3 px-3 py-2 text-sm', on && 'bg-muted')}>
                    <input type="checkbox" className="h-4 w-4 accent-black" checked={on} onChange={() => setItemIds(on ? itemIds.filter((id) => id !== item.id) : [...itemIds, item.id])} />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-ink-soft">{formatMoney(item.price)}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          {submitted && errors.items && <p className="mt-2 text-sm font-semibold text-danger">{errors.items}</p>}
        </fieldset>
        <Input
          label="Combo price (RWF)"
          type="number"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={submitted ? errors.price : undefined}
          hint={regular > 0 ? `Separately ${formatMoney(regular)}${priceNum > 0 && priceNum < regular ? ` · saves ${formatMoney(regular - priceNum)}` : ''}` : undefined}
        />
        <Switch label="Active" checked={isActive} onChange={setIsActive} />
      </div>
    </Modal>
  )
}
