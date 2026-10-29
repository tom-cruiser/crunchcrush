import { useAuth } from '@/store/auth'
import { usePreferences } from '@/store/preferences'
import type { ID } from '@/types'
import { ApiError, isOffline } from './client'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

/** Staff-only endpoints always use the staff token. */
const isStaffPath = (path: string) => /^\/(admin|riders|staff)\b/.test(path)
/** Shared endpoints (an order by number, settings) use the staff token from the staff screens. */
const onStaffScreen = () => typeof window !== 'undefined' && /^\/(admin|rider)\b/.test(window.location.pathname)

interface HttpOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
  /** The guest's access token for this order (returned when it was placed). */
  orderId?: ID
}

/**
 * Calls the backend. Picks the customer or staff token, signs that session out on 401
 * and turns `{code, message}` errors into `ApiError`. 204 resolves to `undefined`.
 */
export async function http<T>(path: string, { method = 'GET', body, query, orderId }: HttpOptions = {}): Promise<T> {
  if (method !== 'GET' && isOffline()) throw new ApiError('offline', 'You are offline. Reconnect and try again.')

  const asStaff = isStaffPath(path) || onStaffScreen()
  const auth = useAuth.getState()
  const token = asStaff ? auth.staffToken : auth.customerToken
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const orderToken = orderId && usePreferences.getState().orderTokens[orderId]
  if (orderToken) headers['X-Order-Token'] = orderToken

  let payload: BodyInit | undefined
  if (body instanceof FormData) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== '') params.set(k, String(v))
  const qs = params.toString()
  const url = `${BASE}${path}${qs ? `?${qs}` : ''}`

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: payload })
  } catch {
    throw new ApiError(isOffline() ? 'offline' : 'network_error', isOffline() ? 'You are offline. Reconnect and try again.' : 'Can’t reach Crunch Crust right now. Try again in a moment.')
  }

  if (res.status === 401 && token) {
    if (asStaff) auth.signOutStaff()
    else auth.signOutCustomer()
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { code?: string; message?: string } | null
    throw new ApiError(err?.code ?? 'server_error', err?.message ?? 'Something went wrong. Please try again.')
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
