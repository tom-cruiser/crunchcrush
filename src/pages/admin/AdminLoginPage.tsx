import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api'
import { Button, Card, CardBody, Input } from '@/components/ui'
import { can, homeForRole } from '@/features/auth/permissions'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const { staff, setStaff } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    trigger,
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
      setError('password', { message: (e as Error).message })
    }
  }

  const forgotPassword = async () => {
    if (!(await trigger('email'))) return
    try {
      await authApi.requestStaffPasswordReset(getValues('email'))
      toast.success('If this email has a staff account, a reset link is on its way.')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col gap-5 p-6">
          <Link to="/" className="-ml-2 -mt-2 flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-ink-soft hover:bg-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('common.back')}
          </Link>
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
            <button type="button" onClick={forgotPassword} className="self-center text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink">
              Forgot password?
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
