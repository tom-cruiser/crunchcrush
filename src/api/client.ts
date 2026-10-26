import type { ApiErrorShape } from '@/types'
import { persist } from './mock/db'

export class ApiError extends Error implements ApiErrorShape {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}

export const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface MockOptions {
  /** Writes fail while offline; reads are served from the local cache like the service worker would. */
  write?: boolean
  minDelay?: number
  maxDelay?: number
}

/**
 * Runs a mock handler with network-like latency and returns a deep copy, so callers can
 * never mutate the mock database by accident. Swap these handlers for `fetch` calls to
 * connect a real backend; the UI only depends on the exported function signatures.
 */
export async function mock<T>(handler: () => T, { write = false, minDelay = 250, maxDelay = 700 }: MockOptions = {}): Promise<T> {
  if (write && isOffline()) {
    throw new ApiError('offline', 'You are offline. Reconnect and try again.')
  }
  await wait(isOffline() ? 50 : minDelay + Math.random() * (maxDelay - minDelay))
  const result = handler()
  // Reads can advance simulated state too (order progress, payments), so always persist.
  persist()
  return structuredClone(result)
}

export function notFound(what: string): never {
  throw new ApiError('not_found', `${what} not found`)
}
