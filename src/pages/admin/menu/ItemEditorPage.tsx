import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ImagePlus } from 'lucide-react'
import { menuApi } from '@/api'
import { Button, ButtonLink, Card, EmptyState, ErrorState, Input, Select, SkeletonList, Switch, Textarea } from '@/components/ui'
import { AddOnsField, OptionGroupsField } from '@/features/admin/menu/OptionGroupsField'
import { ALLERGENS, DIETARY_TAGS, fromFormValues, itemSchema, resizeImage, toFormValues, type ItemFormValues } from '@/features/admin/menu/itemSchema'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { invalidateCache, useAsync } from '@/lib/useAsync'
import { toast } from '@/store/toast'
import type { MenuItem } from '@/types'

export default function ItemEditorPage() {
  const { itemId } = useParams()
  const [params] = useSearchParams()
  const menu = useAsync(() => menuApi.getAdminMenu(), [], 'admin-menu')

  if (menu.error && !menu.data) return <ErrorState error={menu.error} onRetry={menu.reload} />
  if (!menu.data) return <SkeletonList rows={6} />

  const existing = itemId ? menu.data.items.find((i) => i.id === itemId) : undefined
  if (itemId && !existing) {
    return (
      <EmptyState
        title="Item not found"
        description="It may have been deleted."
        action={
          <ButtonLink to="/admin/menu">Back to menu</ButtonLink>
        }
      />
    )
  }
  return (
    <ItemForm
      key={itemId ?? 'new'}
      existing={existing}
      categories={menu.data.categories}
      defaultCategory={params.get('category') ?? menu.data.categories[0]?.id ?? ''}
      nextSortOrder={menu.data.items.length + 1}
    />
  )
}

interface FormProps {
  existing?: MenuItem
  categories: { id: string; name: string }[]
  defaultCategory: string
  nextSortOrder: number
}

function ItemForm({ existing, categories, defaultCategory, nextSortOrder }: FormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty, isSubmitted },
  } = useForm<ItemFormValues>({ resolver: zodResolver(itemSchema), defaultValues: toFormValues(existing, defaultCategory) })

  const imageUrl = watch('imageUrl')
  const price = watch('price')

  // Warn before losing unsaved edits on refresh/close.
  useEffect(() => {
    if (!isDirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  useEffect(() => {
    if (isSubmitted && Object.keys(errors).length > 0) document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors, isSubmitted])

  const upload = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      setValue('imageUrl', await resizeImage(file), { shouldDirty: true, shouldValidate: true })
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await menuApi.saveMenuItem(fromFormValues(values, existing, nextSortOrder))
      invalidateCache('admin-menu')
      invalidateCache('menu')
      toast.success(`${saved.name} saved`)
      navigate(`/admin/menu?category=${saved.categoryId}`)
    } catch (e) {
      toast.error((e as Error).message)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto flex max-w-3xl flex-col gap-5 pb-24">
      <div className="flex items-center gap-3">
        <Link to="/admin/menu" aria-label="Back to menu" className="rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-extrabold">{existing ? `Edit ${existing.name}` : 'New item'}</h1>
      </div>

      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn('relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted', errors.imageUrl ? 'border-danger' : 'border-line')}
              aria-label="Upload photo"
            >
              {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-8 w-8 text-ink-soft" />}
              {uploading && <span className="absolute inset-0 bg-white/60" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
            <Input aria-label="Image URL" placeholder="…or paste an image URL" {...register('imageUrl')} error={errors.imageUrl?.message} />
          </div>
          <div className="flex flex-col gap-4">
            <Input label="Name" {...register('name')} error={errors.name?.message} />
            <Textarea label="Description" rows={3} {...register('description')} error={errors.description?.message} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Price (RWF)" type="number" inputMode="numeric" {...register('price', { valueAsNumber: true })} error={errors.price?.message} hint={Number.isFinite(price) ? formatMoney(price) : 'VAT included'} />
              <Select label="Category" {...register('categoryId')} error={errors.categoryId?.message}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Input label="Prep time (min)" type="number" inputMode="numeric" {...register('prepTimeMinutes', { valueAsNumber: true })} error={errors.prepTimeMinutes?.message} />
              <Input
                label="Calories (optional)"
                type="number"
                inputMode="numeric"
                {...register('calories', { setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)) })}
                error={errors.calories?.message}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Visibility">
        <Controller control={control} name="isAvailable" render={({ field }) => <Switch label="Available to order" description="Turn off to mark it sold out" checked={field.value} onChange={field.onChange} />} />
        <Controller control={control} name="isPopular" render={({ field }) => <Switch label="Popular" description="Shown in the featured rail with a badge" checked={field.value} onChange={field.onChange} />} />
        <Controller control={control} name="isRecommended" render={({ field }) => <Switch label="Recommended" description="Suggested in the cart as an add-on" checked={field.value} onChange={field.onChange} />} />
      </Section>

      <Section title="Options" description="Choices the customer makes, like size or protein. Prices are added to the base price.">
        <OptionGroupsField control={control} register={register} errors={errors} />
      </Section>

      <Section title="Add-ons" description="Paid extras.">
        <AddOnsField control={control} register={register} errors={errors} />
      </Section>

      <Section title="Dietary and allergens">
        <Controller
          control={control}
          name="dietaryTags"
          render={({ field }) => <ChipGroup legend="Dietary tags" values={DIETARY_TAGS} selected={field.value} onChange={field.onChange} label={(v) => t(`tags.${v}`)} />}
        />
        <Controller
          control={control}
          name="allergens"
          render={({ field }) => <ChipGroup legend="Allergens" values={ALLERGENS} selected={field.value} onChange={field.onChange} label={(v) => t(`allergens.${v}`)} />}
        />
        <Input label="Removable ingredients" placeholder="e.g. Onions, Coriander, Chilli" hint="Comma-separated. Customers can ask for these to be left out." {...register('removableIngredients')} />
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 p-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/menu')}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={isSubmitting || uploading}>
            {existing ? 'Save changes' : 'Add to menu'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {description && <p className="text-sm text-ink-soft">{description}</p>}
      </div>
      {children}
    </Card>
  )
}

function ChipGroup<T extends string>({ legend, values, selected, onChange, label }: { legend: string; values: T[]; selected: T[]; onChange: (v: T[]) => void; label: (v: T) => string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const on = selected.includes(v)
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? selected.filter((x) => x !== v) : [...selected, v])}
              className={cn('rounded-full border px-3 py-1.5 text-sm font-semibold', on ? 'border-brand bg-brand text-brand-fg' : 'border-line hover:bg-muted')}
            >
              {label(v)}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
