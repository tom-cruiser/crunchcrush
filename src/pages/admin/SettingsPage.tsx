import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { resetDemoData, settingsApi } from '@/api'
import { Button, Card, ErrorState, Input, Modal, SkeletonList, Switch } from '@/components/ui'
import { FULFILLMENT_TYPES, PAYMENT_METHODS, settingsSchema, toPatch, toValues, type SettingsValues } from '@/features/admin/settings/settingsSchema'
import { uid } from '@/lib/id'
import { invalidateCache, useAsync } from '@/lib/useAsync'
import { toast } from '@/store/toast'
import type { RestaurantSettings } from '@/types'

export default function SettingsPage() {
  const settings = useAsync(() => settingsApi.getSettings(), [], 'settings')
  if (settings.error && !settings.data) return <ErrorState error={settings.error} onRetry={settings.reload} />
  if (!settings.data) return <SkeletonList rows={6} />
  return <SettingsForm settings={settings.data} onSaved={settings.setData} />
}

function SettingsForm({ settings, onSaved }: { settings: RestaurantSettings; onSaved: (s: RestaurantSettings) => void }) {
  const { t } = useTranslation()
  const [confirmReset, setConfirmReset] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting, isSubmitted },
  } = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema), defaultValues: toValues(settings) })
  const holidays = useFieldArray({ control, name: 'holidayClosures' })
  const hours = watch('openingHours')

  useEffect(() => {
    if (isSubmitted && Object.keys(errors).length > 0) document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors, isSubmitted])

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await settingsApi.updateSettings(toPatch(values, settings))
      onSaved(saved)
      reset(toValues(saved))
      invalidateCache('settings')
      toast.success('Settings saved')
    } catch (e) {
      toast.error((e as Error).message)
    }
  })

  /** Quick toggles save immediately, independent of the form. */
  const saveNow = async (patch: Partial<RestaurantSettings>, message: string) => {
    try {
      onSaved(await settingsApi.updateSettings(patch))
      invalidateCache('settings')
      toast.show(message)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto flex max-w-3xl flex-col gap-5 pb-24">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <Section title="Store status" description="These switches take effect immediately.">
        <Switch label="Accepting orders" description="When off, customers can browse the menu but not order." checked={settings.isOpen} onChange={(on) => saveNow({ isOpen: on }, on ? 'Store open' : 'Store closed')} />
        <Switch
          label="Busy mode"
          description={`Adds ${settings.busyExtraMinutes} minutes to every estimate customers see.`}
          checked={settings.busyMode}
          onChange={(on) => saveNow({ busyMode: on }, on ? 'Busy mode on' : 'Busy mode off')}
        />
      </Section>

      <Section title="Restaurant">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <Input label="Tagline" {...register('tagline')} error={errors.tagline?.message} />
          <Input label="Phone" type="tel" {...register('phone')} error={errors.phone?.message} />
          <Input label="WhatsApp (optional)" type="tel" {...register('whatsapp')} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Street" {...register('street')} error={errors.street?.message} />
          <Input label="Area" {...register('area')} error={errors.area?.message} />
        </div>
      </Section>

      <Section title="Opening hours" description="Kigali time. Orders can be scheduled within these hours.">
        <div className="flex flex-col divide-y divide-line">
          {hours.map((h, i) => (
            <div key={h.day} className="grid grid-cols-[6rem_1fr] items-start gap-3 py-2 sm:grid-cols-[8rem_auto_1fr]">
              <span className="pt-3 font-semibold">{t(`days.${h.day}`)}</span>
              <label className="flex h-12 items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-black" checked={!h.closed} onChange={(e) => setValue(`openingHours.${i}.closed`, !e.target.checked, { shouldDirty: true })} />
                Open
              </label>
              {h.closed ? (
                <span className="col-span-2 pb-2 text-sm text-ink-soft sm:col-span-1 sm:pt-3">Closed all day</span>
              ) : (
                <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1">
                  <Input aria-label={`${t(`days.${h.day}`)} opens`} type="time" {...register(`openingHours.${i}.open`)} error={errors.openingHours?.[i]?.open?.message} />
                  <Input aria-label={`${t(`days.${h.day}`)} closes`} type="time" {...register(`openingHours.${i}.close`)} error={errors.openingHours?.[i]?.close?.message} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Holiday closures" description="The store shows as closed all day on these dates.">
        {holidays.fields.length === 0 && <p className="text-sm text-ink-soft">No closures planned.</p>}
        {holidays.fields.map((field, i) => (
          <div key={field.id} className="grid grid-cols-[10rem_1fr_auto] items-start gap-2">
            <Input aria-label="Date" type="date" {...register(`holidayClosures.${i}.date`)} error={errors.holidayClosures?.[i]?.date?.message} />
            <Input aria-label="Reason" placeholder="Reason" {...register(`holidayClosures.${i}.reason`)} error={errors.holidayClosures?.[i]?.reason?.message} />
            <button type="button" aria-label="Remove closure" onClick={() => holidays.remove(i)} className="flex h-12 items-center rounded-full px-2 hover:bg-muted">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => holidays.append({ id: uid('hol'), date: '', reason: '' })}>
          Add closure
        </Button>
      </Section>

      <Section title="Ordering">
        <Controller
          control={control}
          name="fulfillmentTypes"
          render={({ field, fieldState }) => (
            <CheckGroup legend="Ways to order" options={FULFILLMENT_TYPES.map((f) => ({ value: f, label: t(`fulfillment.${f}`) }))} value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <Controller
          control={control}
          name="enabledPaymentMethods"
          render={({ field, fieldState }) => (
            <CheckGroup legend="Payment methods" options={PAYMENT_METHODS.map((m) => ({ value: m, label: t(`payment.${m}`) }))} value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Minimum order (RWF)" type="number" inputMode="numeric" {...register('minimumOrder', { valueAsNumber: true })} error={errors.minimumOrder?.message} />
          <Input label="Default prep time (min)" type="number" inputMode="numeric" {...register('defaultPrepTimeMinutes', { valueAsNumber: true })} error={errors.defaultPrepTimeMinutes?.message} />
          <Input label="Busy mode adds (min)" type="number" inputMode="numeric" {...register('busyExtraMinutes', { valueAsNumber: true })} error={errors.busyExtraMinutes?.message} />
        </div>
      </Section>

      <Section title="Tax">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="VAT rate (%)" type="number" step="0.5" inputMode="decimal" {...register('taxRatePercent', { valueAsNumber: true })} error={errors.taxRatePercent?.message} />
        </div>
        <Controller
          control={control}
          name="taxInclusive"
          render={({ field }) => <Switch label="Menu prices include VAT" description="Receipts then show the VAT contained in the total instead of adding it." checked={field.value} onChange={field.onChange} />}
        />
      </Section>

      <Section title="Demo data" description="Everything in this demo is stored in this browser.">
        <Button variant="outline" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirmReset(true)} className="self-start">
          Reset demo data
        </Button>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 p-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <p className="flex-1 text-sm text-ink-soft">{isDirty ? 'You have unsaved changes' : 'All changes saved'}</p>
          <Button variant="outline" disabled={!isDirty} onClick={() => reset(toValues(settings))}>
            Discard
          </Button>
          <Button type="submit" disabled={!isDirty} loading={isSubmitting}>
            Save
          </Button>
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                resetDemoData()
                invalidateCache()
                window.location.reload()
              }}
            >
              Reset
            </Button>
          </div>
        }
      >
        <p className="text-ink-soft">Menu, orders, settings and staff go back to the original sample data. Your staff sign-in stays.</p>
      </Modal>
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

function CheckGroup<T extends string>({ legend, options, value, onChange, error }: { legend: string; options: { value: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; error?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
              className={on ? 'rounded-full border border-brand bg-brand px-3 py-1.5 text-sm font-semibold text-brand-fg' : 'rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:bg-muted'}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
    </fieldset>
  )
}
