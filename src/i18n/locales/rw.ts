import type { Resources } from './en'

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

// Kinyarwanda: to be filled in by a native speaker. Missing keys fall back to English.
const rw: DeepPartial<Resources> = {}

export default rw
