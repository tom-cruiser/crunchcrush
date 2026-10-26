import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bike, Car, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { settingsApi, staffApi } from '@/api'
import { Badge, Button, Card, EmptyState, ErrorState, Input, Modal, Select, SkeletonList, Switch } from '@/components/ui'
import { ZoneEditor } from '@/features/admin/delivery/ZoneEditor'
import { ZoneMap } from '@/features/admin/delivery/ZoneMap'
import { formatMoney, formatPhone } from '@/lib/format'
import { invalidateCache, useAsync } from '@/lib/useAsync'
import { toast } from '@/store/toast'
import type { DeliveryZone, Rider, RiderStatus } from '@/types'

const RIDER_STATUS: Record<RiderStatus, { label: string; tone: 'success' | 'info' | 'neutral' }> = {
  available: { label: 'Available', tone: 'success' },
  on_delivery: { label: 'On a delivery', tone: 'info' },
  offline: { label: 'Offline', tone: 'neutral' },
}

export default function DeliveryPage() {
  const zones = useAsync(() => settingsApi.getDeliveryZones(), [], 'admin-zones')
  const riders = useAsync(() => staffApi.listRiders(), [], 'admin-riders')
  const [editing, setEditing] = useState<DeliveryZone | 'new'>()
  const [deleting, setDeleting] = useState<DeliveryZone>()
  const [editingRider, setEditingRider] = useState<Rider>()

  const setZones = (next: DeliveryZone[]) => {
    zones.setData([...next].sort((a, b) => a.radiusKm - b.radiusKm))
    invalidateCache('zones')
  }

  const toggleZone = async (zone: DeliveryZone, isActive: boolean) => {
    try {
      const saved = await settingsApi.saveDeliveryZone({ ...zone, isActive })
      setZones((zones.data ?? []).map((z) => (z.id === saved.id ? saved : z)))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const removeZone = async () => {
    if (!deleting) return
    try {
      await settingsApi.deleteDeliveryZone(deleting.id)
      setZones((zones.data ?? []).filter((z) => z.id !== deleting.id))
      toast.success('Zone deleted')
      setDeleting(undefined)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const setRiderStatus = async (rider: Rider, status: RiderStatus) => {
    try {
      const saved = await staffApi.setRiderStatus(rider.id, status)
      riders.setData((riders.data ?? []).map((r) => (r.id === saved.id ? saved : r)))
      invalidateCache('riders')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">Delivery</h1>

      <section aria-labelledby="zones-heading" className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h2 id="zones-heading" className="text-lg font-bold">
            Zones and fees
          </h2>
          <Button size="sm" className="ml-auto" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
            Zone
          </Button>
        </div>
        {zones.error && !zones.data ? (
          <ErrorState error={zones.error} onRetry={zones.reload} />
        ) : !zones.data ? (
          <SkeletonList rows={3} />
        ) : zones.data.length === 0 ? (
          <Card>
            <EmptyState icon={<MapPin className="h-6 w-6" />} title="No delivery zones" description="Without a zone, customers can only pick up." action={<Button onClick={() => setEditing('new')}>Add zone</Button>} />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <Card className="flex items-center p-4">
              <ZoneMap zones={zones.data} />
            </Card>
            <Card>
              <ul className="divide-y divide-line">
                {zones.data.map((z) => (
                  <li key={z.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {z.name} <span className="font-normal text-ink-soft">· up to {z.radiusKm} km</span>
                      </p>
                      <p className="text-sm text-ink-soft">
                        Fee {formatMoney(z.fee)} · min order {formatMoney(z.minOrder)} · ~{z.estimatedMinutes} min
                      </p>
                    </div>
                    <Switch size="sm" label={z.isActive ? 'Active' : 'Off'} checked={z.isActive} onChange={(on) => toggleZone(z, on)} />
                    <div className="flex">
                      <button type="button" aria-label={`Edit ${z.name}`} onClick={() => setEditing(z)} className="rounded-full p-2 hover:bg-muted">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label={`Delete ${z.name}`} onClick={() => setDeleting(z)} className="rounded-full p-2 hover:bg-muted">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </section>

      <section aria-labelledby="riders-heading" className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h2 id="riders-heading" className="text-lg font-bold">
            Riders
          </h2>
          <Link to="/admin/staff" className="ml-auto text-sm font-semibold underline underline-offset-4">
            Add riders in Staff
          </Link>
        </div>
        {riders.error && !riders.data ? (
          <ErrorState error={riders.error} onRetry={riders.reload} />
        ) : !riders.data ? (
          <SkeletonList rows={2} />
        ) : riders.data.length === 0 ? (
          <Card>
            <EmptyState icon={<Bike className="h-6 w-6" />} title="No riders yet" description="Add a staff member with the Rider role." />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {riders.data.map((r) => {
              const VehicleIcon = r.vehicle === 'car' ? Car : Bike
              return (
                <Card key={r.id} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <VehicleIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{r.name}</p>
                      <p className="text-sm text-ink-soft">
                        {r.vehicle}
                        {r.plateNumber && ` · ${r.plateNumber}`}
                      </p>
                    </div>
                    <Badge tone={RIDER_STATUS[r.status].tone}>{RIDER_STATUS[r.status].label}</Badge>
                  </div>
                  {r.activeOrderIds.length > 0 && <p className="text-sm">{r.activeOrderIds.length} active {r.activeOrderIds.length === 1 ? 'delivery' : 'deliveries'}</p>}
                  <div className="flex items-center gap-2">
                    <a href={`tel:${r.phone}`} className="flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
                      <Phone className="h-4 w-4" /> {formatPhone(r.phone)}
                    </a>
                    <div className="ml-auto flex items-center gap-1">
                      {r.status !== 'on_delivery' && (
                        <Switch size="sm" hideLabel label={`${r.name} available`} checked={r.status === 'available'} onChange={(on) => setRiderStatus(r, on ? 'available' : 'offline')} />
                      )}
                      <button type="button" aria-label={`Edit ${r.name}’s vehicle`} onClick={() => setEditingRider(r)} className="rounded-full p-2 hover:bg-muted">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {editing && zones.data && (
        <ZoneEditor
          zone={editing === 'new' ? undefined : editing}
          zones={zones.data}
          onClose={() => setEditing(undefined)}
          onSaved={(z) => setZones(zones.data!.some((x) => x.id === z.id) ? zones.data!.map((x) => (x.id === z.id ? z : x)) : [...zones.data!, z])}
        />
      )}

      {editingRider && (
        <RiderEditor
          rider={editingRider}
          onClose={() => setEditingRider(undefined)}
          onSaved={(saved) => {
            riders.setData((riders.data ?? []).map((r) => (r.id === saved.id ? saved : r)))
            invalidateCache('riders')
          }}
        />
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        title="Delete zone"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setDeleting(undefined)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={removeZone}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-ink-soft">Delete “{deleting?.name}”? Addresses only this zone covered will no longer get delivery. To pause it, switch it off instead.</p>
      </Modal>
    </div>
  )
}

function RiderEditor({ rider, onClose, onSaved }: { rider: Rider; onClose: () => void; onSaved: (r: Rider) => void }) {
  const [vehicle, setVehicle] = useState(rider.vehicle)
  const [plate, setPlate] = useState(rider.plateNumber ?? '')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try {
      onSaved(await staffApi.saveRider(rider.id, { vehicle, plateNumber: plate.trim().toUpperCase() || undefined }))
      toast.success('Rider updated')
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={rider.name}
      size="sm"
      footer={
        <Button fullWidth loading={busy} onClick={save}>
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Select label="Vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value as Rider['vehicle'])}>
          <option value="motorbike">Motorbike</option>
          <option value="bicycle">Bicycle</option>
          <option value="car">Car</option>
        </Select>
        <Input label="Plate number" placeholder="RC 123 A" value={plate} onChange={(e) => setPlate(e.target.value)} />
      </div>
    </Modal>
  )
}
