import { settingsApi } from '@/api'
import { useAsync } from '@/lib/useAsync'

/** Restaurant settings, cached across screens. */
export function useSettings() {
  return useAsync(() => settingsApi.getSettings(), [], 'settings')
}
