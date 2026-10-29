import type { ApiErrorShape } from '@/types'

export class ApiError extends Error implements ApiErrorShape {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}

export const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false
