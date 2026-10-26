import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ordersApi } from '@/api'
import { Button, Card, CardBody, Textarea } from '@/components/ui'
import { toast } from '@/store/toast'
import type { Order } from '@/types'
import { StarDisplay, StarRating } from './StarRating'

export function RatingCard({ order, onRated }: { order: Order; onRated: (order: Order) => void }) {
  const { t } = useTranslation()
  const [food, setFood] = useState(0)
  const [second, setSecond] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const isDelivery = order.fulfillment === 'delivery'

  if (order.rating) {
    return (
      <Card>
        <CardBody className="flex flex-col gap-2">
          <h2 className="font-bold">{t('rating.yourRating')}</h2>
          <p className="flex items-center gap-2 text-sm">
            {t('rating.food')} <StarDisplay value={order.rating.food} />
          </p>
          {order.rating.delivery !== undefined && (
            <p className="flex items-center gap-2 text-sm">
              {isDelivery ? t('rating.delivery') : t('rating.service')} <StarDisplay value={order.rating.delivery} />
            </p>
          )}
          {order.rating.comment && <p className="text-sm text-ink-soft italic">“{order.rating.comment}”</p>}
        </CardBody>
      </Card>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const updated = await ordersApi.rateOrder(order.id, { food, delivery: second || undefined, comment: comment.trim() || undefined })
      toast.success(t('rating.thanks'))
      onRated(updated)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-ink">
      <CardBody>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold">{t('rating.title')}</h2>
          <StarRating name="food" label={t('rating.food')} value={food} onChange={setFood} />
          <StarRating name="second" label={isDelivery ? t('rating.delivery') : t('rating.service')} value={second} onChange={setSecond} />
          <Textarea label={t('rating.comment')} rows={2} maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button type="submit" disabled={food === 0} loading={busy}>
            {t('rating.submit')}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
