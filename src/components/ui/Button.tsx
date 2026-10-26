import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-fg hover:bg-neutral-800 active:bg-neutral-700',
  secondary: 'bg-muted text-ink hover:bg-neutral-200 active:bg-neutral-300',
  outline: 'border border-line bg-surface text-ink hover:bg-muted',
  ghost: 'bg-transparent text-ink hover:bg-muted',
  danger: 'bg-danger text-white hover:bg-red-800',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-6 text-base gap-2 rounded-xl',
  icon: 'h-11 w-11 rounded-full',
}

interface ButtonLook {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth, className }: ButtonLook & { className?: string }) {
  return cn(
    'inline-flex items-center justify-center font-semibold transition-colors select-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full min-w-0 shrink' : 'shrink-0',
    className,
  )
}

/** Looks like a button, navigates like a link (never a button nested in a link). */
export function ButtonLink({ variant, size, fullWidth, leftIcon, rightIcon, className, children, ...props }: ButtonLook & LinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  )
}

/** Button-styled plain anchor, for tel:, WhatsApp and other external links. */
export function ButtonAnchor({ variant, size, fullWidth, leftIcon, rightIcon, className, children, ...props }: ButtonLook & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </a>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, leftIcon, rightIcon, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
})
