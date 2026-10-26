import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api'
import { Button, Card, CardBody, Input } from '@/components/ui'
import { can, homeForRole, ROLE_LABELS } from '@/features/auth/permissions'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'
import type { StaffRole } from '@/types'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

const DEMO_ACCOUNTS: { role: StaffRole; email: string }[] = [
  { role: 'owner', email: 'owner@crunchcrust.rw' },
  { role: 'manager', email: 'manager@crunchcrust.rw' },
  { role: 'cashier', email: 'cashier@crunchcrust.rw' },
  { role: 'kitchen', email: 'kitchen@crunchcrust.rw' },
  { role: 'rider', email: 'rider1@crunchcrust.rw' },
]

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const { staff, setStaff } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (staff) return <Navigate to={homeForRole(staff.role)} replace />

  const onSubmit = async ({ email, password }: FormValues) => {
    try {
      const session = await authApi.staffLogin(email, password)
      setStaff(session.user, session.token)
      toast.success(`Welcome, ${session.user.name.split(' ')[0]}`)
      const target = from && (from.startsWith('/rider') ? can(session.user.role, 'rider.app') : session.user.role !== 'rider') ? from : homeForRole(session.user.role)
      navigate(target, { replace: true })
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col gap-5 p-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <img src="/favicon.svg" alt="" className="h-12 w-12" />
            <h1 className="text-xl font-extrabold">{t('admin.signIn')}</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input label="Email" type="email" autoComplete="username" {...register('email')} error={errors.email?.message} />
            <Input label="Password" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
            <Button type="submit" fullWidth loading={isSubmitting}>
              Sign in
            </Button>
          </form>
          <div className="rounded-xl bg-muted p-3 text-xs text-ink-soft">
            <p className="mb-2 font-semibold text-ink">Demo accounts (password demo1234)</p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.role}
                  type="button"
                  className="rounded-full bg-surface px-2.5 py-1 font-semibold text-ink ring-1 ring-line hover:ring-ink"
                  onClick={() => {
                    setValue('email', a.email)
                    setValue('password', 'demo1234')
                  }}
                >
                  {ROLE_LABELS[a.role]}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
