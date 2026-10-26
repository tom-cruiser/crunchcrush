import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ordersApi } from '@/api'
import { Button, Modal, Textarea } from '@/components/ui'
import { ChoiceCard } from '@/features/checkout/components/ChoiceCard'
import { toast } from '@/store/toast'
import type { Order, ProblemReport } from '@/types'

const TYPES: ProblemReport['type'][] = ['missing_item', 'wrong_item', 'late', 'quality', 'other']

export function ProblemReportSheet({ order, open, onClose, onReported }: { order: Order; open: boolean; onClose: () => void; onReported: (o: Order) => void }) {
  const { t } = useTranslation()
  const [type, setType] = useState<ProblemReport['type']>('missing_item')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (message.trim().length < 5) return setError('Please describe the problem in a few words.')
    setBusy(true)
    try {
      onReported(await ordersApi.reportProblem(order.id, { type, message: message.trim() }))
      toast.success(t('rating.problemSent'))
      setMessage('')
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
      title={t('rating.reportProblem')}
      footer={
        <Button fullWidth onClick={submit} loading={busy}>
          {t('rating.sendReport')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">{t('rating.problemType')}</legend>
          {TYPES.filter((ty) => ty !== 'late' || order.fulfillment === 'delivery').map((ty) => (
            <ChoiceCard key={ty} name="problem-type" value={ty} checked={type === ty} onChange={() => setType(ty)} title={t(`rating.types.${ty}`)} />
          ))}
        </fieldset>
        <Textarea
          label={t('rating.problemMessage')}
          rows={3}
          maxLength={500}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            setError(undefined)
          }}
          error={error}
        />
      </div>
    </Modal>
  )
}
