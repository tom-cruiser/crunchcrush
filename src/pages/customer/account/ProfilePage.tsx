import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api'
import { Button, Card, CardBody, Input } from '@/components/ui'
import { formatPhone } from '@/lib/format'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.union([z.literal(''), z.email('Enter a valid email')]),
})

export default function ProfilePage() {
  const { t } = useTranslation()
  const { customer, setCustomer } = useAuth()
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: customer?.name ?? '', email: customer?.email ?? '' } })
  if (!customer) return null

  const submit = async (values: z.infer<typeof schema>) => {
    try {
      setCustomer(await authApi.updateProfile(customer.id, { name: values.name.trim(), email: values.email || undefined }))
      form.reset(values)
      toast.success(t('account.saved'))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/account" aria-label={t('common.back')} className="-ml-2 rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-extrabold">{t('account.profile')}</h1>
      </div>
      <Card>
        <CardBody>
          <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
            <Input label={t('account.name')} autoComplete="name" {...form.register('name')} error={form.formState.errors.name?.message} />
            <Input label={t('account.email')} type="email" autoComplete="email" {...form.register('email')} error={form.formState.errors.email?.message} />
            <Input label={t('account.phone')} value={formatPhone(customer.phone)} disabled hint={t('account.phoneLocked')} />
            <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
              {t('common.save')}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
