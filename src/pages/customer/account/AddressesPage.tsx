import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api'
import { Badge, Button, Card, CardBody, EmptyState, Modal } from '@/components/ui'
import { NewAddressForm, useZoneCheck, type AddressDraft } from '@/features/checkout/components/AddressPicker'
import { formatMoney } from '@/lib/format'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'
import type { Address } from '@/types'

function AddressEditor({ initial, open, onClose }: { initial?: Address; open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { customer, setCustomer } = useAuth()
  const [draft, setDraft] = useState<AddressDraft>({ address: initial, isNew: !initial, save: false })
  const [makeDefault, setMakeDefault] = useState(initial?.isDefault ?? false)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const { zone, loading } = useZoneCheck(draft.address)

  const save = async () => {
    const a = draft.address
    if (!customer || !a) return setError(t('checkout.chooseAddress'))
    if (a.street.trim().length < 3) return setError('Add your street and house number.')
    setBusy(true)
    try {
      const { id, ...rest } = a
      setCustomer(await authApi.saveAddress(customer.id, { ...rest, id: initial ? id : undefined, label: rest.label.trim() || 'Home', isDefault: makeDefault }))
      toast.success(t('account.saved'))
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? t('account.editAddress') : t('account.addAddress')}
      footer={
        <Button fullWidth onClick={save} loading={busy}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <NewAddressForm
          value={draft}
          onChange={(d) => {
            setDraft(d)
            setError(undefined)
          }}
          showLabel
          showSave={false}
        />
        {draft.address && (
          <>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="h-5 w-5 accent-ink" />
              {t('account.makeDefault')}
            </label>
            {!loading && zone && (
              <p className={zone.deliverable ? 'text-sm text-success' : 'text-sm text-danger'}>
                {zone.deliverable && zone.zone ? t('checkout.deliverable', { fee: formatMoney(zone.zone.fee), minutes: zone.zone.estimatedMinutes }) : t('checkout.notDeliverable', { area: draft.address.area, km: zone.distanceKm })}
              </p>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

export default function AddressesPage() {
  const { t } = useTranslation()
  const { customer, setCustomer } = useAuth()
  const [editing, setEditing] = useState<Address | 'new'>()
  const [deleting, setDeleting] = useState<Address>()
  const [busy, setBusy] = useState(false)
  if (!customer) return null

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      setCustomer(await authApi.deleteAddress(customer.id, deleting.id))
      setDeleting(undefined)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/account" aria-label={t('common.back')} className="-ml-2 rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-2xl font-extrabold">{t('account.addresses')}</h1>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
          {t('common.add')}
        </Button>
      </div>

      {customer.addresses.length === 0 ? (
        <EmptyState icon={<MapPin className="h-6 w-6" />} title={t('account.noAddresses')} description={t('account.noAddressesBody')} action={<Button onClick={() => setEditing('new')}>{t('account.addAddress')}</Button>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {customer.addresses.map((a) => (
            <li key={a.id}>
              <Card>
                <CardBody className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-bold">
                      {a.label} {a.isDefault && <Badge tone="dark">{t('account.default')}</Badge>}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {a.street}, {a.area}, {a.city}
                    </p>
                    {a.instructions && <p className="text-sm text-ink-soft italic">{a.instructions}</p>}
                  </div>
                  <Button size="icon" variant="ghost" aria-label={`${t('common.edit')} ${a.label}`} onClick={() => setEditing(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={`${t('common.delete')} ${a.label}`} onClick={() => setDeleting(a)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {editing && <AddressEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} open onClose={() => setEditing(undefined)} />}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        title={t('account.deleteAddress')}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setDeleting(undefined)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" fullWidth onClick={remove} loading={busy}>
              {t('common.delete')}
            </Button>
          </div>
        }
      >
        <p className="text-ink-soft">{t('account.deleteAddressConfirm', { label: deleting?.label })}</p>
      </Modal>
    </div>
  )
}
