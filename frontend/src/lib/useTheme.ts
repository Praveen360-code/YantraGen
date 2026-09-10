import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

/** Live `data-theme` on <html>, so any 3D viewer can follow the toggle. */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark',
  )
  useEffect(() => {
    const el = document.documentElement
    const cb = () =>
      setTheme(el.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
    const mo = new MutationObserver(cb)
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])
  return theme
}