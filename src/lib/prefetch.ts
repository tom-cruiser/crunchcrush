type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }

/**
 * Warms route chunks once the browser is idle, so the next screens open without a
 * spinner. Skipped on data-saver connections. Same specifiers as the lazy() routes,
 * so the module cache is shared.
 */
export function prefetchWhenIdle(loaders: (() => Promise<unknown>)[]) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return
  const run = () => loaders.forEach((load) => load().catch(() => undefined))
  const w = window as IdleWindow
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 4000 })
  else window.setTimeout(run, 2000)
}
