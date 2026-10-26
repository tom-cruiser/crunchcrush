import { useState } from 'react'
import { menuApi } from '@/api'
import { Button, Input, Modal, Switch, Textarea } from '@/components/ui'
import { toast } from '@/store/toast'
import type { MenuCategory } from '@/types'

interface Props {
  category?: MenuCategory
  nextSortOrder: number
  itemCount: number
  onClose: () => void
  onSaved: (c: MenuCategory) => void
  onDeleted: (id: string) => void
}

/** Create/edit a category, including its availability window (menu scheduling). */
export function CategoryEditor({ category, nextSortOrder, itemCount, onClose, onSaved, onDeleted }: Props) {
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
  const [scheduled, setScheduled] = useState(Boolean(category?.availableFrom))
  const [from, setFrom] = useState(category?.availableFrom ?? '06:30')
  const [to, setTo] = useState(category?.availableTo ?? '11:00')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (name.trim().length < 2) return setError('Enter a category name')
    if (scheduled && from >= to) return setError('The end time must be after the start time')
    setBusy(true)
    try {
      onSaved(
        await menuApi.saveCategory({
          id: category?.id,
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
          sortOrder: category?.sortOrder ?? nextSortOrder,
          availableFrom: scheduled ? from : undefined,
          availableTo: scheduled ? to : undefined,
        }),
      )
      toast.success('Category saved')
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!category) return
    setBusy(true)
    try {
      await menuApi.deleteCategory(category.id)
      onDeleted(category.id)
      toast.success('Category deleted')
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
      title={category ? 'Edit category' : 'New category'}
      footer={
        <div className="flex gap-2">
          {category && (
            <Button variant="ghost" onClick={remove} disabled={busy || itemCount > 0} title={itemCount > 0 ? 'Move or delete its items first' : undefined}>
              Delete
            </Button>
          )}
          <Button fullWidth onClick={save} loading={busy}>
            Save
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(undefined)
          }}
          error={error && name.trim().length < 2 ? error : undefined}
        />
        <Textarea label="Description (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Switch label="Visible on the menu" description="Hidden categories and their items don't appear to customers" checked={isActive} onChange={setIsActive} />
        <Switch label="Only available at certain times" description="E.g. breakfast. Items show but can't be ordered outside the window." checked={scheduled} onChange={setScheduled} />
        {scheduled && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="From" type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="To" type="time" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
        {error && name.trim().length >= 2 && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        {category && itemCount > 0 && <p className="text-xs text-ink-soft">This category has {itemCount} items, so it can’t be deleted.</p>}
      </div>
    </Modal>
  )
}
