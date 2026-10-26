import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  /** Visually hidden title for dialogs that show their own heading inside `children`. */
  ariaLabel?: string
  children: ReactNode
  footer?: ReactNode
  /** "auto" is a bottom sheet on phones and a centred dialog from the sm breakpoint up. */
  variant?: 'auto' | 'sheet' | 'center'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Overrides the padding of the scrolling body, e.g. for edge-to-edge images. */
  bodyClassName?: string
}

const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

/**
 * Built on the native <dialog> element, which gives focus trapping, Esc to close and
 * an inert background for free.
 */
export function Modal({ open, onClose, title, ariaLabel, children, footer, variant = 'auto', size = 'md', className, bodyClassName }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const sheet = variant === 'sheet' || variant === 'auto'
  return (
    <dialog
      ref={ref}
      aria-label={ariaLabel}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'm-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/50 backdrop:animate-fade-in',
        'h-dvh w-full',
        open ? 'flex' : 'hidden',
        sheet ? 'items-end' : 'items-center justify-center p-4',
        variant === 'auto' && 'sm:items-center sm:justify-center sm:p-4',
      )}
    >
      <div
        className={cn(
          'flex w-full flex-col overflow-hidden bg-surface shadow-xl',
          sheet ? 'max-h-[92dvh] animate-slide-up rounded-t-3xl' : 'max-h-[90dvh] animate-fade-in rounded-3xl',
          variant === 'auto' && 'sm:max-h-[90dvh] sm:animate-fade-in sm:rounded-3xl',
          variant !== 'sheet' && widths[size],
          className,
        )}
      >
        {sheet && <div aria-hidden="true" className={cn('mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-300', variant === 'auto' && 'sm:hidden')} />}
        {(title || !ariaLabel) && (
          <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
            <h2 className="text-lg font-bold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 rounded-full p-2 text-ink-soft hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={cn('flex-1 overflow-y-auto overscroll-contain', bodyClassName ?? 'px-5 pb-5')}>{children}</div>
        {footer && <div className="pb-safe border-t border-line bg-surface px-5 py-3">{footer}</div>}
      </div>
    </dialog>
  )
}
