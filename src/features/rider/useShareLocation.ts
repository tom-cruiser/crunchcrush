import { useEffect, useRef, useState } from 'react'
import { staffApi } from '@/api'

export type LocationState = 'off' | 'waiting' | 'sharing' | 'denied' | 'unsupported'

/** Watches the device position while `enabled` and posts it at most every `intervalMs`. */
export function useShareLocation(riderId: string | undefined, enabled: boolean, intervalMs = 10_000): LocationState {
  const [state, setState] = useState<LocationState>('off')
  const lastSent = useRef(0)

  useEffect(() => {
    if (!enabled || !riderId) {
      setState('off')
      return
    }
    if (!('geolocation' in navigator)) {
      setState('unsupported')
      return
    }
    setState('waiting')
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState('sharing')
        if (Date.now() - lastSent.current < intervalMs) return
        lastSent.current = Date.now()
        staffApi.updateRiderLocation(riderId, { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {
          // Offline: the next position update will retry.
          lastSent.current = 0
        })
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'waiting'),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [riderId, enabled, intervalMs])

  return state
}
