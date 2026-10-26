import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { staffApi } from '@/api'
import { Badge, Button, Card, EmptyState, ErrorState, Modal, SkeletonList } from '@/components/ui'
import { StaffEditor } from '@/features/admin/staff/StaffEditor'
import { ROLE_LABELS, ROLE_PERMISSIONS, type Permission } from '@/features/auth/permissions'
import { cn } from '@/lib/cn'
import { formatDate, formatPhone } from '@/lib/format'
import { invalidateCache, useAsync } from '@/lib/useAsync'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/toast'
import type { Staff, StaffRole } from '@/types'

const PERMISSION_LABELS: Record<Permission, string> = {
  'orders.view': 'See orders',
  'orders.manage': 'Accept and update orders',
  'menu.view': 'See menu',
  'menu.edit': 'Edit menu and prices',
  'menu.availability': 'Mark items sold out',
  'delivery.manage': 'Delivery zones and riders',
  'settings.manage': 'Store settings',
  'promotions.manage': 'Promotions',
  'staff.manage': 'Manage staff',
  'reports.view': 'Sales reports',
  'customers.view': 'Customers and feedback',
  'rider.app': 'Rider app',
}
const ROLES = Object.keys(ROLE_LABELS) as StaffRole[]

export default function StaffPage() {
  const me = useAuth((s) => s.staff)
  const staff = useAsync(() => staffApi.listStaff(), [], 'admin-staff')
  const [editing, setEditing] = useState<Staff | 'new'>()
  const [deleting, setDeleting] = useState<Staff>()
  const list = staff.data ?? []

  const upsert = (s: Staff) => {
    staff.setData(list.some((x) => x.id === s.id) ? list.map((x) => (x.id === s.id ? s : x)) : [...list, s])
    invalidateCache('admin-riders')
    invalidateCache('riders')
  }
  const remove = async () => {
    if (!deleting) return
    try {
      await staffApi.deleteStaff(deleting.id)
      staff.setData(list.filter((s) => s.id !== deleting.id))
      invalidateCache('admin-riders')
      invalidateCache('riders')
      toast.success(`${deleting.name} removed`)
      setDeleting(undefined)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold">Staff</h1>
        <Button size="sm" className="ml-auto" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
          Staff member
        </Button>
      </div>

      {staff.error && !staff.data ? (
        <ErrorState error={staff.error} onRetry={staff.reload} />
      ) : !staff.data ? (
        <SkeletonList rows={5} />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-6 w-6" />} title="No staff yet" action={<Button onClick={() => setEditing('new')}>Add staff member</Button>} />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {ROLES.flatMap((role) => list.filter((s) => s.role === role)).map((s) => (
              <li key={s.id} className={cn('flex flex-wrap items-center gap-3 p-4', !s.isActive && 'opacity-60')}>
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-bold">
                  {s.name
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {s.name} {s.id === me?.id && <span className="font-normal text-ink-soft">(you)</span>}
                  </p>
                  <p className="truncate text-sm text-ink-soft">
                    {s.email} · {formatPhone(s.phone)}
                  </p>
                  <p className="text-xs text-ink-soft">Since {formatDate(s.createdAt)}</p>
                </div>
                <Badge tone={s.role === 'owner' ? 'dark' : 'outline'}>{ROLE_LABELS[s.role]}</Badge>
                {!s.isActive && <Badge>Deactivated</Badge>}
                <div className="flex">
                  <button type="button" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)} className="rounded-full p-2 hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  {s.id !== me?.id && (
                    <button type="button" aria-label={`Remove ${s.name}`} onClick={() => setDeleting(s)} className="rounded-full p-2 hover:bg-muted">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section aria-labelledby="roles-heading" className="flex flex-col gap-3">
        <h2 id="roles-heading" className="text-lg font-bold">
          What each role can do
        </h2>
        {/* Scrolls sideways on phones; focusable so keyboard users can scroll it too. */}
        <Card className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby="roles-heading">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="p-3 font-semibold">
                  Permission
                </th>
                {ROLES.map((r) => (
                  <th key={r} scope="col" className="p-3 text-center font-semibold">
                    {ROLE_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(Object.keys(PERMISSION_LABELS) as Permission[]).map((p) => (
                <tr key={p}>
                  <th scope="row" className="p-3 text-left font-normal">
                    {PERMISSION_LABELS[p]}
                  </th>
                  {ROLES.map((r) => (
                    <td key={r} className="p-3 text-center">
                      {ROLE_PERMISSIONS[r].includes(p) ? <Check className="mx-auto h-4 w-4" aria-label="Yes" /> : <span className="text-ink-soft" aria-label="No">–</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {editing && <StaffEditor staff={editing === 'new' ? undefined : editing} isSelf={editing !== 'new' && editing.id === me?.id} onClose={() => setEditing(undefined)} onSaved={upsert} />}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        title="Remove staff member"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setDeleting(undefined)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={remove}>
              Remove
            </Button>
          </div>
        }
      >
        <p className="text-ink-soft">Remove {deleting?.name}? They won’t be able to sign in. To keep their record, deactivate them instead.</p>
      </Modal>
    </div>
  )
}
