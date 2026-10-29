import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, authApi } from '@/api'
import { Button, Card, CardBody, Input } from '@/components/ui'
import { isRwMobile, normalizeRwPhone } from '@/features/checkout/schema'
import { homeForRole } from '@/features/auth/permissions'
import { cn } from '@/lib/cn'
import { formatPhone } from '@/lib/format'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'
import type { User } from '@/types'

const RESEND_SECONDS = 30

const phoneSchema = z.object({ phone: z.string().refine(isRwMobile, 'Enter a Rwandan mobile number, e.g. 078 123 4567') })
const emailSchema = z.object({ email: z.email('Enter a valid email'), password: z.string().min(6, 'At least 6 characters') })
const nameSchema = z.object({ name: z.string().trim().min(2, 'Enter your name') })

/** Only allow in-app redirects, never an external URL from the query string. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/account')

function PhoneLogin({ onSignedIn }: { onSignedIn: (user: User, token: string) => void }) {
  const { t } = useTranslation()
  const [phone, setPhone] = useState<string>()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string>()
  const [verifying, setVerifying] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const form = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema), defaultValues: { phone: '' } })

  useEffect(() => {
    if (resendIn <= 0) return
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [resendIn])

  const send = async (raw: string) => {
    try {
      const res = await authApi.requestOtp(normalizeRwPhone(raw))
      setPhone(res.phone)
      setResendIn(RESEND_SECONDS)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return
    if (!/^\d{6}$/.test(code)) return setCodeError('Enter the 6-digit code')
    setVerifying(true)
    try {
      const session = await authApi.verifyOtp(phone, code)
      onSignedIn(session.user, session.token)
    } catch (err) {
      setCodeError((err as Error).message)
    } finally {
      setVerifying(false)
    }
  }

  if (!phone) {
    return (
      <form onSubmit={form.handleSubmit(({ phone }) => send(phone))} className="flex flex-col gap-4" noValidate>
        <Input label={t('auth.phone')} inputMode="tel" autoComplete="tel" placeholder="078 123 4567" {...form.register('phone')} error={form.formState.errors.phone?.message} />
        <Button type="submit" fullWidth size="lg" loading={form.formState.isSubmitting}>
          {t('auth.sendCode')}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={verify} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-ink-soft">{t('auth.codeSent', { phone: formatPhone(phone) })}</p>
      <Input
        label={t('auth.code')}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, ''))
          setCodeError(undefined)
        }}
        error={codeError}
        className="text-center text-2xl font-bold tracking-[0.5em]"
      />
      <Button type="submit" fullWidth size="lg" loading={verifying}>
        {t('auth.verify')}
      </Button>
      <div className="flex justify-between text-sm">
        <button type="button" className="font-semibold underline underline-offset-2" onClick={() => setPhone(undefined)}>
          {t('auth.changePhone')}
        </button>
        <button type="button" className="font-semibold underline underline-offset-2 disabled:no-underline disabled:opacity-50" disabled={resendIn > 0} onClick={() => send(phone)}>
          {resendIn > 0 ? t('auth.resendIn', { seconds: resendIn }) : t('auth.resend')}
        </button>
      </div>
    </form>
  )
}

function EmailLogin({ onSignedIn }: { onSignedIn: (user: User, token: string) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setStaff = useAuth((s) => s.setStaff)
  const form = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema), defaultValues: { email: '', password: '' } })
  const submit = async ({ email, password }: z.infer<typeof emailSchema>) => {
    try {
      const session = await authApi.loginWithEmail(email, password)
      onSignedIn(session.user, session.token)
    } catch (e) {
      if (!(e instanceof ApiError && e.code === 'staff_account')) {
        form.setError('password', { message: (e as Error).message })
        return
      }
      // A staff email: sign in to the staff side from the same form.
      try {
        const session = await authApi.staffLogin(email, password)
        setStaff(session.user, session.token)
        toast.success(t('auth.welcome', { name: session.user.name.split(' ')[0] }))
        navigate(homeForRole(session.user.role), { replace: true })
      } catch (staffError) {
        form.setError('password', { message: (staffError as Error).message })
      }
    }
  }
  return (
    <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <Input label={t('auth.email')} type="email" autoComplete="email" {...form.register('email')} error={form.formState.errors.email?.message} />
      <Input label={t('auth.password')} type="password" autoComplete="current-password" {...form.register('password')} error={form.formState.errors.password?.message} hint={t('auth.emailHint')} />
      <Button type="submit" fullWidth size="lg" loading={form.formState.isSubmitting}>
        {t('auth.signIn')}
      </Button>
    </form>
  )
}

function CompleteProfile({ user, onDone }: { user: User; onDone: (user: User) => void }) {
  const { t } = useTranslation()
  const form = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema), defaultValues: { name: '' } })
  const submit = async ({ name }: z.infer<typeof nameSchema>) => {
    try {
      onDone(await authApi.updateProfile(user.id, { name: name.trim() }))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }
  return (
    <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <p className="font-semibold">{t('auth.completeProfile')}</p>
      <Input label={t('account.name')} autoComplete="name" autoFocus {...form.register('name')} error={form.formState.errors.name?.message} />
      <Button type="submit" fullWidth size="lg" loading={form.formState.isSubmitting}>
        {t('auth.continue')}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const { customer, setCustomer } = useAuth()
  const [method, setMethod] = useState<'phone' | 'email'>('phone')
  const [needsName, setNeedsName] = useState<User>()

  if (customer && !needsName) return <Navigate to={next} replace />

  const onSignedIn = (user: User, token: string) => {
    if (!user.name) {
      setNeedsName(user)
      setCustomer(user, token)
      return
    }
    setCustomer(user, token)
    toast.success(t('auth.welcome', { name: user.name.split(' ')[0] }))
    navigate(next, { replace: true })
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 py-4">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">{t('auth.signInTitle')}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t('auth.signInBody')}</p>
      </div>
      <Card>
        <CardBody className="flex flex-col gap-5 p-5">
          {needsName ? (
            <CompleteProfile
              user={needsName}
              onDone={(user) => {
                setCustomer(user)
                setNeedsName(undefined)
                toast.success(t('auth.welcomeNew'))
                navigate(next, { replace: true })
              }}
            />
          ) : (
            <>
              <div role="tablist" aria-label="Sign-in method" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                {(['phone', 'email'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={method === m}
                    onClick={() => setMethod(m)}
                    className={cn('flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold', method === m ? 'bg-surface shadow-sm' : 'text-ink-soft')}
                  >
                    {m === 'phone' ? <Phone className="h-4 w-4" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
                    {m === 'phone' ? t('auth.withPhone') : t('auth.withEmail')}
                  </button>
                ))}
              </div>
              <div role="tabpanel">{method === 'phone' ? <PhoneLogin onSignedIn={onSignedIn} /> : <EmailLogin onSignedIn={onSignedIn} />}</div>
            </>
          )}
        </CardBody>
      </Card>
      {!needsName && (
        <Link to={next === '/account' ? '/' : next} className="text-center text-sm font-semibold underline underline-offset-2">
          {t('auth.skipGuest')}
        </Link>
      )}
    </div>
  )
}
