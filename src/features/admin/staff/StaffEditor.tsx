import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { staffApi } from '@/api'
import { Button, Input, Modal, Select, Switch } from '@/components/ui'
import { ROLE_LABELS } from '@/features/auth/permissions'
import { isRwMobile, normalizeRwPhone } from '@/features/checkout/schema'
import { toast } from '@/store/toast'
import type { Staff, StaffRole } from '@/types'

const ROLES = Object.keys(ROLE_LABELS) as StaffRole[]

const schema = z.object({
  name: z.string().trim().min(2, 'Enter their name'),
  email: z.email('Enter a valid email'),
  phone: z.string().refine(isRwMobile, 'Enter a Rwandan mobile number'),
  role: z.enum(ROLES as [StaffRole, ...StaffRole[]]),
  isActive: z.boolean(),
})
type Values = z.infer<typeof schema>

interface Props {
  staff?: Staff
  /** The signed-in user can't demote or deactivate themselves. */
  isSelf: boolean
  onClose: () => void
  onSaved: (s: Staff) => void
}

export function StaffEditor({ staff, isSelf, onClose, onSaved }: Props) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: staff ?? { name: '', email: '', phone: '', role: 'cashier', isActive: true },
  })

  const onSubmit = handleSubmit(async (v) => {
    try {
      const saved = await staffApi.saveStaff({ ...v, id: staff?.id, email: v.email.trim().toLowerCase(), phone: normalizeRwPhone(v.phone) })
      onSaved(saved)
      toast.success(`${saved.name} saved`)
      onClose()
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === 'duplicate_email') setError('email', { message: (e as Error).message })
      else if (code === 'last_owner') setError('role', { message: (e as Error).message })
      else toast.error((e as Error).message)
    }
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={staff ? `Edit ${staff.name}` : 'Add staff member'}
      footer={
        <Button fullWidth loading={isSubmitting} onClick={onSubmit}>
          Save
        </Button>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input label="Full name" autoComplete="off" {...register('name')} error={errors.name?.message} />
        <Input label="Email (used to sign in)" type="email" autoComplete="off" {...register('email')} error={errors.email?.message} />
        <Input label="Phone" type="tel" placeholder="078 123 4567" {...register('phone')} error={errors.phone?.message} />
        <Select label="Role" disabled={isSelf} {...register('role')} error={errors.role?.message} hint={isSelf ? 'You can’t change your own role' : 'Riders get a rider profile for deliveries'}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch label="Can sign in" description={isSelf ? 'You can’t deactivate yourself' : 'Switch off when someone leaves; their history is kept'} disabled={isSelf} checked={field.value} onChange={field.onChange} />
          )}
        />
        {!staff && <p className="text-xs text-ink-soft">Demo: new staff sign in with the demo password demo1234.</p>}
      </form>
    </Modal>
  )
}
