import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToasts, type ToastTone } from '@/store/toast'

const icons: Record<ToastTone, React.ReactNode> = {
  default: null,
  success: <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />,
  error: <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />,
  info: <Info className="h-5 w-5 text-blue-300" aria-hidden="true" />,
}

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div aria-live="polite" aria-atomic="false" className="no-print pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cn('pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl bg-brand px-4 py-3 text-brand-fg shadow-lg')}
        >
          {icons[t.tone]}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description && <p className="mt-0.5 text-sm text-neutral-300">{t.description}</p>}
          </div>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action?.onClick()
                dismiss(t.id)
              }}
              className="text-sm font-bold underline underline-offset-2"
            >
              {t.action.label}
            </button>
          )}
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-mr-1 rounded-full p-1 text-neutral-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
