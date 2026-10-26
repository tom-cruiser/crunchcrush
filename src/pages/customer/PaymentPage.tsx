import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Smartphone, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, ordersApi, paymentsApi } from '@/api'
import type { PaymentSession } from '@/api/payments'
import { Button, Card, CardBody, ErrorState, Input, Select, SkeletonList, Spinner } from '@/components/ui'
import { formatCardNumber, isAirtel, isMtn, isRwMobile, normalizeRwPhone } from '@/features/checkout/schema'
import { useSettings } from '@/features/store/useSettings'
import { formatMoney } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { toast } from '@/store/toast'
import type { Order, PaymentMethod } from '@/types'

const POLL_MS = 1500

function RetryForm({ order, onStarted }: { order: Order; onStarted: (session: PaymentSession) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: settings } = useSettings()
  const methods = settings?.enabledPaymentMethods ?? ['mtn_momo', 'airtel_money', 'card', 'cash']
  const [method, setMethod] = useState<PaymentMethod>(order.paymentMethod)
  const [phone, setPhone] = useState(order.customerPhone)
  const [card, setCard] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const start = async () => {
    setError(undefined)
    if (method === 'mtn_momo' && !(isRwMobile(phone) && isMtn(phone))) return setError('Enter an MTN number (078 or 079)')
    if (method === 'airtel_money' && !(isRwMobile(phone) && isAirtel(phone))) return setError('Enter an Airtel number (072 or 073)')
    if (method === 'card' && card.replace(/\D/g, '').length < 13) return setError('Enter a valid card number')
    setBusy(true)
    try {
      const session = await paymentsApi.initiatePayment(order.id, {
        method,
        phone: method === 'mtn_momo' || method === 'airtel_money' ? normalizeRwPhone(phone) : undefined,
        cardLast4: method === 'card' ? card.replace(/\D/g, '').slice(-4) : undefined,
      })
      if (method === 'cash') navigate(`/order/${order.id}/confirmed`, { replace: true })
      else onStarted(session)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    setBusy(true)
    try {
      await ordersApi.cancelOrder(order.id, 'Payment not completed')
      toast.show('Order cancelled')
      navigate('/', { replace: true })
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 text-left">
      <Select label={t('checkout.payment')} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
        {methods.map((m) => (
          <option key={m} value={m}>
            {t(`payment.${m}`)}
          </option>
        ))}
      </Select>
      {(method === 'mtn_momo' || method === 'airtel_money') && <Input label={t('checkout.momoPhone')} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} />}
      {method === 'card' && <Input label={t('checkout.cardNumber')} inputMode="numeric" placeholder="4242 4242 4242 4242" value={card} onChange={(e) => setCard(formatCardNumber(e.target.value))} error={error} />}
      <Button fullWidth onClick={start} loading={busy}>
        {method === 'cash' ? t('pay.switchToCash') : t('pay.retry')}
      </Button>
      {order.status === 'received' && (
        <Button fullWidth variant="ghost" onClick={cancel} disabled={busy}>
          Cancel order
        </Button>
      )}
    </div>
  )
}

export default function PaymentPage() {
  const { t } = useTranslation()
  const { orderId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = params.get('session')
  const order = useAsync(() => ordersApi.getOrder(orderId), [orderId])
  const [session, setSession] = useState<PaymentSession>()
  const [lost, setLost] = useState(!sessionId)

  // Poll until the payment leaves "pending".
  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      try {
        const s = await paymentsApi.getPaymentStatus(sessionId)
        if (cancelled) return
        setSession(s)
        setLost(false)
        if (s.status === 'pending') timer = setTimeout(poll, POLL_MS)
      } catch (e) {
        if (cancelled) return
        if (e instanceof ApiError && e.code === 'not_found') setLost(true)
        else timer = setTimeout(poll, POLL_MS * 2)
      }
    }
    void poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [sessionId])

  useEffect(() => {
    if (session?.status === 'paid') {
      const timer = setTimeout(() => navigate(`/order/${orderId}/confirmed`, { replace: true }), 1200)
      return () => clearTimeout(timer)
    }
  }, [session?.status, navigate, orderId])

  if (order.error) return <ErrorState error={order.error} onRetry={order.reload} />
  if (!order.data) return <SkeletonList rows={2} />

  // The order was already paid (e.g. the page was reloaded after success).
  if (order.data.paymentStatus === 'paid' && !session) return <Navigate to={`/order/${orderId}/confirmed`} replace />

  const startNew = (s: PaymentSession) => {
    setSession(s)
    setLost(false)
    setParams({ session: s.id }, { replace: true })
  }

  const isCard = (session?.method ?? order.data.paymentMethod) === 'card'

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-4">
      <Card>
        <CardBody className="flex flex-col items-center gap-4 p-6 text-center" aria-live="polite">
          <p className="text-sm font-semibold text-ink-soft">
            {t('pay.orderNumber', { number: order.data.orderNumber })} · {formatMoney(order.data.pricing.total)}
          </p>

          {lost ? (
            <>
              <XCircle className="h-12 w-12" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-extrabold">{t('pay.lost')}</h1>
                <p className="mt-1 text-sm text-ink-soft">{t('pay.lostBody')}</p>
              </div>
              <RetryForm order={order.data} onStarted={startNew} />
            </>
          ) : !session || session.status === 'pending' ? (
            <>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Spinner className="absolute h-20 w-20 text-ink" />
                <Smartphone className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold">{isCard ? t('pay.waitingCard') : t('pay.approve')}</h1>
                <p className="mt-1 text-sm text-ink-soft">{session?.instructions ?? t('pay.waiting')}</p>
                <p className="mt-2 text-xs text-ink-faint">{t('pay.timer')}</p>
              </div>
            </>
          ) : session.status === 'paid' ? (
            <>
              <CheckCircle2 className="h-14 w-14 text-success" aria-hidden="true" />
              <h1 className="text-xl font-extrabold">{t('pay.success')}</h1>
            </>
          ) : (
            <>
              <XCircle className="h-14 w-14 text-danger" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-extrabold">{t('pay.failed')}</h1>
                <p className="mt-1 text-sm text-ink-soft">{session.failureReason}</p>
              </div>
              <RetryForm order={order.data} onStarted={startNew} />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
