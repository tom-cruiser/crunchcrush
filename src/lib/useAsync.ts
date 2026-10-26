import { useCallback, useEffect, useRef, useState } from 'react'

const cache = new Map<string, unknown>()

export interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  reload: () => Promise<void>
  /** Replace the cached data without refetching, e.g. after a mutation returns the new value. */
  setData: (data: T) => void
}

/**
 * Minimal data hook. With a `cacheKey`, revisiting a screen shows the last data instantly
 * while it refreshes in the background. Swap for TanStack Query later if needed.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], cacheKey?: string): AsyncState<T> {
  const [data, setDataState] = useState<T | undefined>(() => (cacheKey ? (cache.get(cacheKey) as T | undefined) : undefined))
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(data === undefined)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const callId = useRef(0)

  const setData = useCallback(
    (next: T) => {
      if (cacheKey) cache.set(cacheKey, next)
      setDataState(next)
    },
    [cacheKey],
  )

  const reload = useCallback(async () => {
    const id = ++callId.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await fnRef.current()
      if (id === callId.current) setData(result)
    } catch (e) {
      if (id === callId.current) setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      if (id === callId.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setData, ...deps])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, loading, reload, setData }
}

export function invalidateCache(prefix?: string) {
  for (const key of cache.keys()) if (!prefix || key.startsWith(prefix)) cache.delete(key)
}
