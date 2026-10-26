import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList, Download, Heart, LogIn, LogOut, MapPin, ShieldCheck, User as UserIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonLink, Card, CardBody, Select } from '@/components/ui'
import { useInstallAction } from '@/features/pwa/InstallPrompt'
import { LANGUAGES } from '@/i18n'
import { formatPhone } from '@/lib/format'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'

function Row({ to, icon, label, detail }: { to: string; icon: React.ReactNode; label: string; detail?: string }) {
  return (
    <li>
      <Link to={to} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-muted">
        <span className="text-ink-soft" aria-hidden="true">
          {icon}
        </span>
        <span className="flex-1 font-semibold">{label}</span>
        {detail && <span className="text-sm text-ink-soft">{detail}</span>}
        <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
      </Link>
    </li>
  )
}

export default function AccountPage() {
  const { t, i18n } = useTranslation()
  const install = useInstallAction()
  const navigate = useNavigate()
  const { customer, signOutCustomer } = useAuth()

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('account.title')}</h1>

      {customer ? (
        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-brand-fg">{(customer.name || '?').charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{customer.name}</p>
              <p className="text-sm text-ink-soft">{formatPhone(customer.phone)}</p>
              {customer.email && <p className="truncate text-sm text-ink-soft">{customer.email}</p>}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex flex-col gap-3">
            <p className="font-bold">{t('account.guestTitle')}</p>
            <p className="text-sm text-ink-soft">{t('auth.signInBody')}</p>
            <ButtonLink to="/login" fullWidth leftIcon={<LogIn className="h-4 w-4" />}>
                {t('auth.signIn')}
              </ButtonLink>
          </CardBody>
        </Card>
      )}

      <Card>
        <ul className="divide-y divide-line">
          <Row to="/orders" icon={<ClipboardList className="h-5 w-5" />} label={t('account.orders')} />
          {customer && (
            <>
              <Row to="/account/profile" icon={<UserIcon className="h-5 w-5" />} label={t('account.profile')} />
              <Row to="/account/addresses" icon={<MapPin className="h-5 w-5" />} label={t('account.addresses')} detail={String(customer.addresses.length)} />
              <Row to="/account/favourites" icon={<Heart className="h-5 w-5" />} label={t('account.favourites')} detail={String(customer.favouriteItemIds.length)} />
            </>
          )}
        </ul>
      </Card>

      {install.mode && (
        <Card>
          <button type="button" onClick={install.run} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted">
            <Download className="h-5 w-5" aria-hidden="true" />
            <span className="flex-1 font-semibold">{t('install.account')}</span>
            <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
          </button>
        </Card>
      )}
      {install.sheet}

      <Card>
        <CardBody>
          <Select label={t('account.language')} value={i18n.language} onChange={(e) => void i18n.changeLanguage(e.target.value)} hint={`French and Kinyarwanda: ${t('account.languageSoon')}`}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
                {!l.ready ? ' (beta)' : ''}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      {customer && (
        <Button
          variant="outline"
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={() => {
            signOutCustomer()
            toast.show(t('account.signedOut'))
            navigate('/')
          }}
        >
          {t('account.signOut')}
        </Button>
      )}

      <Link to="/admin" className="flex items-center justify-center gap-1.5 text-sm text-ink-soft underline underline-offset-2">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        {t('account.staff')}
      </Link>
    </div>
  )
}
