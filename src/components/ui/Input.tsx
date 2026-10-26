import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface FieldProps {
  label?: string
  hint?: string
  error?: string
  leftIcon?: ReactNode
}

const control =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-base text-ink placeholder:text-ink-faint transition-colors ' +
  'focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/25 disabled:bg-muted disabled:text-ink-soft'

function FieldShell({ id, label, hint, error, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const describedBy = (id: string, { error, hint }: FieldProps) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined)

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(function Input(
  { label, hint, error, leftIcon, className, id: idProp, ...props },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint">{leftIcon}</span>}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { error, hint })}
          className={cn(control, 'h-12', leftIcon && 'pl-10', error && 'border-danger', className)}
          {...props}
        />
      </div>
    </FieldShell>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(function Textarea(
  { label, hint, error, className, id: idProp, rows = 3, ...props },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { error, hint })}
        className={cn(control, 'py-3', error && 'border-danger', className)}
        {...props}
      />
    </FieldShell>
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(function Select(
  { label, hint, error, className, id: idProp, children, ...props },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { error, hint })}
        className={cn(control, 'h-12 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2020%2020%27%20fill=%27%23525252%27%3E%3Cpath%20d=%27M5.5%207.5L10%2012l4.5-4.5%27%20stroke=%27%23525252%27%20stroke-width=%271.5%27%20fill=%27none%27/%3E%3C/svg%3E")] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10', error && 'border-danger', className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
})
