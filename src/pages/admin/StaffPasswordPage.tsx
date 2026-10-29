import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api'
import { Button, Card, CardBody, Input } from '@/components/ui'
import { homeForRole } from '@/features/auth/permissions'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'The passwords don’t match' })
type FormValues = z.infer<typeof schema>

/**
 * /admin/setup-password and /admin/reset-password. The emailed link carries the token in
 * the URL fragment (#token=…), so it never reaches server logs.
 */
export default function StaffPasswordPage({ mode }: { mode: 'setup' | 'reset' }) {
  const setStaff = useAuth((s) => s.setStaff)
  const navigate = useNavigate()
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }: FormValues) => {
    try {
      const session = mode === 'setup' ? await authApi.setupStaffPassword(token, password) : await authApi.resetStaffPassword(token, password)
      setStaff(session.user, session.token)
      toast.success(`Welcome, ${session.user.name.split(' ')[0]}`)
      navigate(homeForRole(session.user.role), { replace: true })
    } catch (e) {
      setError('password', { message: (e as Error).message })
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col gap-5 p-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <img src="/favicon.svg" alt="" className="h-12 w-12" />
            <h1 className="text-xl font-extrabold">{mode === 'setup' ? 'Set your password' : 'Choose a new password'}</h1>
          </div>
          {token ? (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input label="New password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
              <Input label="Repeat password" type="password" autoComplete="new-password" {...register('confirm')} error={errors.confirm?.message} />
              <Button type="submit" fullWidth loading={isSubmitting}>
                Save and sign in
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-ink-soft">This link is incomplete. Open the link from your email again, or ask a manager for a new one.</p>
          )}
          <Link to="/admin/login" className="text-center text-sm font-semibold underline underline-offset-2">
            Back to sign in
          </Link>
        </CardBody>
      </Card>
    </div>
  )
}
