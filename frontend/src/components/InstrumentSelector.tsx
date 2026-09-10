import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { InstrumentDto } from '../api/types'
import { useTheme } from '../lib/useTheme'

const YantraThumb = lazy(() => import('./YantraThumb'))

function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            obs.disconnect()
          }
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

interface CardProps {
  instrument: InstrumentDto
  active: boolean
  theme: 'dark' | 'light'
  onSelect: (type: string) => void
  onExplore: (type: string) => void
}

function YantraCard({ instrument: inst, active, theme, onSelect, onExplore }: CardProps) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15)
  return (
    <article
      ref={ref}
      data-sound-click
      role="button"
      tabIndex={inst.status === 'coming_soon' ? -1 : 0}
      aria-label={`${inst.name}: choose to compute its dimensions`}
      aria-disabled={inst.status === 'coming_soon'}
      className={`yantra-card3d${active ? ' active' : ''}${
        inst.status === 'coming_soon' ? ' disabled' : ''
      }`}
      onClick={() => inst.status !== 'coming_soon' && onSelect(inst.type)}
      onKeyDown={(e) => {
        if (
          inst.status !== 'coming_soon' &&
          (e.key === 'Enter' || e.key === ' ')
        ) {
          e.preventDefault()
          onSelect(inst.type)
        }
      }}
    >
      <div className="yantra-thumb3d">
        {inView && (
          <Suspense fallback={<div className="thumb-loading" />}>
            <YantraThumb type={inst.type} theme={theme} />
          </Suspense>
        )}
      </div>
      <span className="yantra-card-name">{inst.name}</span>
      <p className="yantra-card-desc">{inst.description}</p>
      {inst.status === 'coming_soon' && <span className="badge">coming soon</span>}
      <div className="yantra-card-actions">
        <button
          className="btn btn-small"
          disabled={inst.status === 'coming_soon'}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(inst.type)
          }}
        >
          Compute
        </button>
        <button
          className="btn btn-small btn-ghost-card"
          disabled={inst.status === 'coming_soon'}
          onClick={(e) => {
            e.stopPropagation()
            onExplore(inst.type)
          }}
        >
          Explore in 3D
        </button>
      </div>
    </article>
  )
}

interface Props {
  instruments: InstrumentDto[]
  selectedType: string | null
  onSelect: (type: string) => void
  onExplore: (type: string) => void
}

export default function InstrumentSelector({
  instruments,
  selectedType,
  onSelect,
  onExplore,
}: Props) {
  const theme = useTheme()
  return (
    <div className="experience-grid">
      {instruments.map((inst) => (
        <YantraCard
          key={inst.type}
          instrument={inst}
          active={inst.type === selectedType}
          theme={theme}
          onSelect={onSelect}
          onExplore={onExplore}
        />
      ))}
    </div>
  )
}