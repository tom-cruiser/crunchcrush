import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/format'
import type { Order, OrderStatus } from '@/types'
import { flowFor, statusLabel } from '../status'

type StepState = 'done' | 'current' | 'upcoming' | 'failed'

/** Vertical timeline of the order flow. Rejected/cancelled orders end with a failed step. */
export function StatusTimeline({ order }: { order: Order }) {
  const { t } = useTranslation()
  const flow = flowFor(order.fulfillment)
  const reached = new Map(order.statusHistory.map((h) => [h.status, h.at]))
  const failed = order.status === 'rejected' || order.status === 'cancelled'

  const steps: { status: OrderStatus; state: StepState; at?: string }[] = []
  if (failed) {
    for (const s of flow) if (reached.has(s)) steps.push({ status: s, state: 'done', at: reached.get(s) })
    steps.push({ status: order.status, state: 'failed', at: reached.get(order.status) })
  } else {
    const currentIndex = flow.indexOf(order.status)
    flow.forEach((s, i) => steps.push({ status: s, state: i < currentIndex || order.status === 'delivered' ? 'done' : i === currentIndex ? 'current' : 'upcoming', at: reached.get(s) }))
  }

  return (
    <ol className="flex flex-col" aria-label="Order progress">
      {steps.map((step, i) => {
        const last = i === steps.length - 1
        return (
          <li key={step.status} className="flex gap-3" aria-current={step.state === 'current' ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                  step.state === 'done' && 'border-ink bg-ink text-white',
                  step.state === 'current' && 'border-ink bg-surface',
                  step.state === 'upcoming' && 'border-line bg-surface',
                  step.state === 'failed' && 'border-danger bg-danger text-white',
                )}
              >
                {step.state === 'done' && <Check className="h-4 w-4" aria-hidden="true" />}
                {step.state === 'failed' && <X className="h-4 w-4" aria-hidden="true" />}
                {step.state === 'current' && (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-ink/20" aria-hidden="true" />
                    <span className="h-2.5 w-2.5 rounded-full bg-ink" aria-hidden="true" />
                  </>
                )}
              </span>
              {!last && <span aria-hidden="true" className={cn('my-1 w-0.5 flex-1', step.state === 'done' ? 'bg-ink' : 'bg-line')} style={{ minHeight: '1.25rem' }} />}
            </div>
            <div className={cn('pb-5', last && 'pb-0')}>
              <p className={cn('leading-7 font-semibold', step.state === 'upcoming' && 'text-ink-faint', step.state === 'failed' && 'text-danger')}>
                {statusLabel(t, step.status, order.fulfillment)}
                <span className="sr-only">{step.state === 'done' ? ' (done)' : step.state === 'current' ? ' (current)' : ''}</span>
              </p>
              {step.at && <p className="text-xs text-ink-soft">{formatTime(step.at)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
