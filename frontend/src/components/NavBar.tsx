import { useState, useEffect, useCallback } from 'react'
import YantraLogo from './YantraLogo'

interface NavItem {
  label: string
  targetId: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'About', targetId: 'about' },
  { label: 'Yantras', targetId: 'yantras' },
  { label: 'Researches', targetId: 'history' },
]

export default function NavBar() {
  const [active, setActive] = useState<string>('about')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = window.localStorage.getItem('yantra-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    window.localStorage.setItem('yantra-theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggleTheme = () => setDark((d) => !d)

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMobileOpen(false)
  }, [])

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => ({
      id: item.targetId,
      el: document.getElementById(item.targetId),
    })).filter((s) => s.el) as { id: string; el: HTMLElement }[]

    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const aTop = a.boundingClientRect.top
            const bTop = b.boundingClientRect.top
            return Math.abs(aTop) - Math.abs(bTop)
          })
        if (visible.length > 0) {
          setActive(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.15 },
    )

    sections.forEach((s) => observer.observe(s.el))
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="navbar-brand" onClick={() => scrollTo('about')}>
          <YantraLogo size={24} />
          <span className="navbar-title">Yantra AI</span>
        </button>

        <button
          className="navbar-hamburger"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          <span className={`hamburger-line${mobileOpen ? ' open' : ''}`} />
          <span className={`hamburger-line${mobileOpen ? ' open' : ''}`} />
          <span className={`hamburger-line${mobileOpen ? ' open' : ''}`} />
        </button>

        <ul className={`navbar-links${mobileOpen ? ' open' : ''}`}>
          {NAV_ITEMS.map((item) => (
            <li key={item.targetId}>
              <button
                className={`navbar-link${active === item.targetId ? ' active' : ''}`}
                onClick={() => scrollTo(item.targetId)}
              >
                {item.label}
              </button>
            </li>
          ))}
          <li>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {dark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
