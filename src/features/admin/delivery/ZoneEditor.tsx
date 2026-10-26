import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { settingsApi } from '@/api'
import { Button, Input, Modal } from '@/components/ui'
import { toast } from '@/store/toast'
import type { DeliveryZone } from '@/types'

const schema = z.object({
  name: z.string().trim().min(2, 'Name the zone'),
  radiusKm: z.number({ error: 'Enter a distance' }).min(0.5, 'At least 0.5 km').max(50, 'At most 50 km'),
  fee: z.number({ error: 'Enter a fee' }).int('Whole francs only').min(0),
  minOrder: z.number({ error: 'Enter an amount' }).int('Whole francs only').min(0),
  estimatedMinutes: z.number({ error: 'Enter minutes' }).int().min(5).max(180),
})
type Values = z.infer<typeof schema>

interface Props {
  zone?: DeliveryZone
  zones: DeliveryZone[]
  onClose: () => void
  onSaved: (zone: DeliveryZone) => void
}

export function ZoneEditor({ zone, zones, onClose, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: zone ?? { name: '', radiusKm: Math.max(0, ...zones.map((z) => z.radiusKm)) + 3, fee: 2000, minOrder: 5000, estimatedMinutes: 45 },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (zones.some((z) => z.id !== zone?.id && z.radiusKm === values.radiusKm)) {
      return setError('radiusKm', { message: 'Another zone already uses this distance' })
    }
    try {
      onSaved(await settingsApi.saveDeliveryZone({ ...values, id: zone?.id, isActive: zone?.isActive ?? true }))
      toast.success('Zone saved')
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    }
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={zone ? 'Edit zone' : 'New delivery zone'}
      footer={
        <Button fullWidth loading={isSubmitting} onClick={onSubmit}>
          Save zone
        </Button>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input label="Name" placeholder="e.g. Remera & Kimironko" {...register('name')} error={errors.name?.message} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Up to (km)" type="number" step="0.5" inputMode="decimal" {...register('radiusKm', { valueAsNumber: true })} error={errors.radiusKm?.message} hint="Straight-line distance" />
          <Input label="Delivery time (min)" type="number" inputMode="numeric" {...register('estimatedMinutes', { valueAsNumber: true })} error={errors.estimatedMinutes?.message} />
          <Input label="Delivery fee (RWF)" type="number" inputMode="numeric" {...register('fee', { valueAsNumber: true })} error={errors.fee?.message} />
          <Input label="Minimum order (RWF)" type="number" inputMode="numeric" {...register('minOrder', { valueAsNumber: true })} error={errors.minOrder?.message} />
        </div>
        <p className="text-xs text-ink-soft">Customers get the smallest active zone that covers their address. Beyond the largest zone, delivery isn’t offered.</p>
      </form>
    </Modal>
  )
}
