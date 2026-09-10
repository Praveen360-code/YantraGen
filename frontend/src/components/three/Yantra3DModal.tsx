import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type {
  InstrumentDto,
  DimensionsResponse,
  DimensionsForm,
  ReferenceSiteDto,
} from '../../api/types'
import { getDimensions, getReferenceSites } from '../../api/client'
import { buildDimensionMap, type DimensionMap } from './dimensions'
import { sound } from '../../lib/sound'
import { useTheme } from '../../lib/useTheme'

const Yantra3D = lazy(() => import('./Yantra3D'))

interface Props {
  instrument: InstrumentDto
  location: { lat: number; long: number }
  params: {
    sizeParam: number
    unit: 'm' | 'ft'
    referenceMeridian: 'ist' | 'ujjain' | 'greenwich'
  }
  onClose: () => void
}

type CompareChoice = { label: string; lat: number; long: number }

const MERIDIAN_LABEL: Record<string, string> = {
  ist: 'IST · 82.5°E',
  ujjain: 'Ujjain · 75.7°E',
  greenwich: 'Greenwich · 0°',
}

function RailButton({
  icon,
  label,
  active,
  onClick,
  title,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  title?: string
}) {
  return (
    <button
      className={`rail-btn${active ? ' active' : ''}`}
      onClick={onClick}
      title={title ?? label}
      aria-pressed={active}
    >
      <span className="rail-icon">{icon}</span>
      <span className="rail-label">{label}</span>
    </button>
  )
}

function DimDiff({ rows }: { rows: { label: string; yours: string; other: string }[] }) {
  return (
    <div className="viewer-compare-table">
      {rows.map((r, i) => (
        <div className="vct-row" key={i}>
          <span className="vct-label">{r.label}</span>
          <span className="vct-yours">{r.yours}</span>
          <span className="vct-other">{r.other}</span>
        </div>
      ))}
    </div>
  )
}

export default function Yantra3DModal({ instrument, location, params, onClose }: Props) {
  const theme = useTheme()
  const controlsRef = useRef<unknown>(null)

  const [showLabels, setShowLabels] = useState(true)
  const [exploded, setExploded] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [resetToken, setResetToken] = useState(0)
  const [specsOpen, setSpecsOpen] = useState(true)
  const [compare, setCompare] = useState<CompareChoice | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sitesQ = useQuery({
    queryKey: ['reference-sites'],
    queryFn: getReferenceSites,
  })
  const sites: ReferenceSiteDto[] = sitesQ.data?.sites ?? []

  const form: DimensionsForm = {
    yantraType: instrument.type,
    lat: location.lat,
    long: location.long,
    sizeParam: params.sizeParam,
    unit: params.unit,
    referenceMeridian: params.referenceMeridian,
  }

  const dimsQ = useQuery<DimensionsResponse>({
    queryKey: ['3d-dimensions', instrument.type, location.lat, location.long, params.sizeParam, params.unit],
    queryFn: () => getDimensions(form),
  })

  // Soft morph chime whenever the instrument's geometry is recomputed
  // (e.g. after a coordinate change) — silent until first user gesture.
  useEffect(() => {
    if (dimsQ.dataUpdatedAt) sound.morph()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimsQ.dataUpdatedAt])

  const compareQ = useQuery<DimensionsResponse>({
    queryKey: [
      '3d-compare',
      instrument.type,
      compare?.lat,
      compare?.long,
      params.sizeParam,
      params.unit,
    ],
    enabled: Boolean(compare),
    queryFn: () =>
      getDimensions({
        ...form,
        lat: compare!.lat,
        long: compare!.long,
      }),
  })

  const dimensionMap: DimensionMap | null = dimsQ.data
    ? buildDimensionMap(dimsQ.data.size_param, dimsQ.data.values)
    : null

  const compareMap: DimensionMap | null = compareQ.data
    ? buildDimensionMap(compareQ.data.size_param, compareQ.data.values)
    : null

  const compareRows = useMemo(() => {
    if (!dimsQ.data || !compareQ.data) return []
    const fmt = (v?: number, u?: string) =>
      v === undefined || v === null ? '—' : `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${u ?? ''}`
    return dimsQ.data.values.slice(0, 12).map((v) => {
      const other = compareQ.data?.values.find((o) => o.key === v.key)
      return {
        label: v.label,
        yours: fmt(v.value, v.unit),
        other: fmt(other?.value, other?.unit),
      }
    })
  }, [dimsQ.data, compareQ.data])

  const handleCompareSite = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId)
    setCompare(site ? { label: site.name, lat: site.lat, long: site.lon } : null)
  }

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <div
        className="viewer"
        role="dialog"
        aria-modal="true"
        aria-label={`${instrument.name} — 3D viewer`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="viewer-head">
          <button className="viewer-back" onClick={onClose} aria-label="Back to gallery">
            ← Gallery
          </button>
          <div className="viewer-title">
            <h2 className="viewer-title-name">{instrument.name}</h2>
            <p className="viewer-title-sub">
              {location.lat.toFixed(3)}°N, {location.long.toFixed(3)}°E · size{' '}
              {params.sizeParam} {params.unit} · {MERIDIAN_LABEL[params.referenceMeridian]}
            </p>
          </div>
          <div className="viewer-head-actions">
            <button
              className={`viewer-specs-btn${specsOpen ? ' active' : ''}`}
              onClick={() => setSpecsOpen((o) => !o)}
              title={specsOpen ? 'Hide dimensions' : 'Show dimensions'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h10M4 18h14" />
              </svg>
              Specs
            </button>
            <button className="viewer-close" onClick={onClose} aria-label="Close 3D view">
              ×
            </button>
          </div>
        </header>

        <div className="viewer-stage">
          {dimensionMap ? (
            <Suspense
              fallback={<div className="viewer-loading">Preparing 3D view…</div>}
            >
              <Yantra3D
                type={instrument.type}
                dims={dimensionMap}
                ghost={compareMap}
                showLabels={showLabels}
                explode={exploded ? 1 : 0}
                autoRotate={autoRotate}
                resetToken={resetToken}
                controlsRef={controlsRef}
                theme={theme}
                cinematicIntro
                enableWhoosh
                morphToken={dimsQ.dataUpdatedAt}
              />
            </Suspense>
          ) : (
            <div className="viewer-loading">Computing dimensions…</div>
          )}

          {/* control rail */}
          <div className="viewer-rail">
            <RailButton
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" />
                </svg>
              }
              label="Labels"
              active={showLabels}
              onClick={() => setShowLabels((v) => !v)}
            />
            <RailButton
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10l7-7 7 7M12 3v9M9 21h6M12 12v9" />
                </svg>
              }
              label="Explode"
              active={exploded}
              onClick={() => setExploded((v) => !v)}
            />
            <RailButton
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <path d="M21 4v4h-4" />
                </svg>
              }
              label="Spin"
              active={autoRotate}
              onClick={() => setAutoRotate((v) => !v)}
            />
            <RailButton
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v4h4" />
                </svg>
              }
              label="Reset view"
              onClick={() => setResetToken((t) => t + 1)}
            />
            <span className="rail-sep" />
            <RailButton
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 11l0 9M8 15v5M13 13v7M18 9v11M21 4v16" />
                </svg>
              }
              label="Compare"
              active={Boolean(compare)}
              onClick={() => setCompare((c) => (c ? null : sites.length ? { label: sites[1].name, lat: sites[1].lat, long: sites[1].lon } : null))}
            />
          </div>

          {/* specs panel */}
          {specsOpen && (
            <aside className="viewer-specs">
              <h4 className="viewer-panel-title">Computed dimensions</h4>
              {dimsQ.isLoading && <p className="viewer-note">Loading…</p>}
              {dimsQ.isError && <p className="viewer-note">Could not load dimensions.</p>}
              {dimensionMap && (
                <ul className="dims-list" key={dimsQ.dataUpdatedAt}>
                  {dimensionMap.labels.map((l) => (
                    <li key={l.key} className="dims-item">
                      <span className="dims-label">{l.label}</span>
                      <span className="dims-value">
                        {l.value.toLocaleString(undefined, { maximumFractionDigits: 3 })} {l.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          )}

          {/* comparison panel */}
          {compare && (
            <div className="viewer-compare">
              <div className="viewer-compare-head">
                <h4 className="viewer-panel-title">Compare geometry</h4>
                <select value="preset" onChange={(e) => handleCompareSite(e.target.value)}>
                  <option value="preset" disabled>
                    Historical observatory
                  </option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="viewer-compare-sub">
                {compare.label} · {compare.lat.toFixed(3)}°N, {compare.long.toFixed(3)}°E
              </p>
              {compareQ.isLoading && <p className="viewer-note">Computing {compare.label}…</p>}
              {compareQ.data && (
                <>
                  <DimDiff rows={compareRows} />
                  <p className="viewer-hint-inline">
                    Transparent gold = {compare.label}; solid = your site. Same size parameter,
                    different latitude — tilts and lengths shift.
                  </p>
                </>
              )}
            </div>
          )}

          {/* footer chip */}
          <div className="viewer-foot">
            <span className="viewer-chip">
              φ = {location.lat.toFixed(3)}°N · λ = {location.long.toFixed(3)}°E
            </span>
          </div>
        </div>

        <p className="viewer-hint">
          Drag to orbit · scroll to zoom · double-click to focus · annotations show computed angles, radii & lengths
        </p>
      </div>
    </div>
  )
}