import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

const APP_NAME = 'Crunch Crust'
const WAIT_MS = 3000

/**
 * Root of every route. After a page change it names the tab after the page's h1
 * and moves focus there, so screen readers announce the new page (SPA navigation
 * is otherwise silent). Query-string changes such as filters or an open item
 * sheet don't count as a page change.
 */
export function RouteFocus() {
  const { pathname } = useLocation()
  // Compared by path rather than a "first run" flag, so StrictMode's double effect doesn't count as navigation.
  const initialPath = useRef(pathname)
  const navigated = useRef(false)

  useEffect(() => {
    if (pathname !== initialPath.current) navigated.current = true
    const isFirst = !navigated.current
    const started = Date.now()
    let timer = 0
    // Lazy pages render their heading a moment after the URL changes.
    const apply = () => {
      const heading = document.querySelector<HTMLElement>('#main h1')
      if (!heading) {
        if (Date.now() - started < WAIT_MS) timer = window.setTimeout(apply, 100)
        return
      }
      const text = heading.textContent?.trim()
      document.title = text && text !== APP_NAME ? `${text} · ${APP_NAME}` : APP_NAME
      // On first load the browser already announces the document; don't steal focus.
      if (isFirst) return
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
    apply()
    return () => window.clearTimeout(timer)
  }, [pathname])

  return <Outlet />
}
