import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { promotionsApi } from '@/api'
import { Button, Input, Modal, Select, Switch, Textarea } from '@/components/ui'
import { toast } from '@/store/toast'
import type { PromoCode, PromoType } from '@/types'

const optionalWhole = z.number().int('Whole numbers only').min(1, 'At least 1').optional()
const blankToUndefined = (v: unknown) => (v === '' || v == null || Number.isNaN(v) ? undefined : Number(v))

const schema = z
  .object({
    code: z.string().trim().regex(/^[A-Za-z0-9]{3,20}$/, '3–20 letters or numbers, no spaces'),
    description: z.string().trim().min(3, 'Describe the offer'),
    type: z.enum(['percentage', 'fixed', 'free_delivery']),
    value: z.number({ error: 'Enter a value' }).min(0),
    minOrder: z.number({ error: 'Enter an amount' }).int().min(0),
    maxDiscount: optionalWhole,
    usageLimit: optionalWhole,
    validFrom: z.string().min(1, 'Pick a start date'),
    validTo: z.string().min(1, 'Pick an end date'),
    isActive: z.boolean(),
  })
  .refine((v) => v.type !== 'percentage' || (v.value >= 1 && v.value <= 100), { path: ['value'], message: 'Between 1 and 100%' })
  .refine((v) => v.type !== 'fixed' || v.value >= 100, { path: ['value'], message: 'At least RWF 100' })
  .refine((v) => v.validFrom <= v.validTo, { path: ['validTo'], message: 'Must be on or after the start date' })
type Values = z.infer<typeof schema>

/** Promo validity is stored as ISO instants; the form edits whole Kigali (UTC+2) days. */
const toKigaliDate = (iso: string) => new Date(new Date(iso).getTime() + 2 * 3_600_000).toISOString().slice(0, 10)
const startOfDay = (date: string) => new Date(`${date}T00:00:00+02:00`).toISOString()
const endOfDay = (date: string) => new Date(`${date}T23:59:59+02:00`).toISOString()

interface Props {
  promo?: PromoCode
  onClose: () => void
  onSaved: (p: PromoCode) => void
}

export function PromoEditor({ promo, onClose, onSaved }: Props) {
  const today = toKigaliDate(new Date().toISOString())
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: promo
      ? { ...promo, validFrom: toKigaliDate(promo.validFrom), validTo: toKigaliDate(promo.validTo) }
      : { code: '', description: '', type: 'percentage', value: 10, minOrder: 0, validFrom: today, validTo: toKigaliDate(new Date(Date.now() + 30 * 86_400_000).toISOString()), isActive: true },
  })
  const type = watch('type') as PromoType

  const onSubmit = handleSubmit(async (v) => {
    try {
      const saved = await promotionsApi.savePromoCode({
        ...v,
        id: promo?.id,
        usedCount: promo?.usedCount,
        value: v.type === 'free_delivery' ? 0 : v.value,
        maxDiscount: v.type === 'percentage' ? v.maxDiscount : undefined,
        validFrom: startOfDay(v.validFrom),
        validTo: endOfDay(v.validTo),
      })
      onSaved(saved)
      toast.success(`${saved.code} saved`)
      onClose()
    } catch (e) {
      if ((e as { code?: string }).code === 'duplicate') setError('code', { message: (e as Error).message })
      else toast.error((e as Error).message)
    }
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={promo ? `Edit ${promo.code}` : 'New promo code'}
      footer={
        <Button fullWidth loading={isSubmitting} onClick={onSubmit}>
          Save code
        </Button>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input label="Code" className="uppercase" autoCapitalize="characters" {...register('code')} error={errors.code?.message} hint="Customers type this at checkout" />
        <Textarea label="Description" rows={2} {...register('description')} error={errors.description?.message} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Discount" {...register('type')}>
            <option value="percentage">Percent off</option>
            <option value="fixed">Amount off</option>
            <option value="free_delivery">Free delivery</option>
          </Select>
          {type !== 'free_delivery' && (
            <Input label={type === 'percentage' ? 'Percent' : 'Amount (RWF)'} type="number" inputMode="numeric" {...register('value', { valueAsNumber: true })} error={errors.value?.message} />
          )}
          <Input label="Minimum order (RWF)" type="number" inputMode="numeric" {...register('minOrder', { valueAsNumber: true })} error={errors.minOrder?.message} />
          {type === 'percentage' && (
            <Input label="Max discount (RWF)" placeholder="No cap" type="number" inputMode="numeric" {...register('maxDiscount', { setValueAs: blankToUndefined })} error={errors.maxDiscount?.message} />
          )}
          <Input label="Starts" type="date" {...register('validFrom')} error={errors.validFrom?.message} />
          <Input label="Ends" type="date" {...register('validTo')} error={errors.validTo?.message} />
          <Input label="Usage limit" placeholder="Unlimited" type="number" inputMode="numeric" {...register('usageLimit', { setValueAs: blankToUndefined })} error={errors.usageLimit?.message} />
        </div>
        <Controller control={control} name="isActive" render={({ field }) => <Switch label="Active" description="Switch off to pause the code without deleting it" checked={field.value} onChange={field.onChange} />} />
      </form>
    </Modal>
  )
}
