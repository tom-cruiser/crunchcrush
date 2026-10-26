import { Spinner } from '@/components/ui'

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-ink-soft">
      <Spinner label="Loading page" className="h-6 w-6" />
    </div>
  )
}
