import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { exportSpec } from '../api/client'
import type { DimensionsResponse, DimensionsForm } from '../api/types'
import { svgViewLabel } from '../lib/labels'

interface Props {
  result?: DimensionsResponse
  loading: boolean
  location: { lat: number; long: number }
  form: DimensionsForm
}

export default function ResultsView({ result, loading, form }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [compareLat, setCompareLat] = useState<number>(26.9) // Jaipur
  const [showCompare, setShowCompare] = useState(false)

  const yantraType = form.yantraType

  const compareMutation = useMutation({
    mutationFn: (lat: number) =>
      fetch(`/api/yantra/${yantraType}/dimensions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          long: form.long,
          size_param: form.sizeParam,
          unit: form.unit,
          reference_meridian: 'ist',
        }),
      }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('compare failed')),
      ),
  })

  const svgViews = result
    ? Object.entries(result.svg).filter(([key]) => key !== 'geometry')
    : []

  const toggleRow = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const doExport = (format: 'csv' | 'dxf' | 'pdf') => {
    exportSpec(form, format).then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yantragen_${form.yantraType}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  // Deterministic dummy values for the loading skeleton.
  return (
    <div className="results-panel">
      <h2 className="panel-title">Results</h2>

      {loading && (
        <div className="results-loading" aria-live="polite" aria-busy="true">
          <div className="spinner">Computing geometry…</div>
          <table className="skeleton-table" aria-hidden="true">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td style={{ width: '38%' }}>
                    <span className="skeleton" style={{ width: '85%' }} />
                  </td>
                  <td style={{ width: '26%' }}>
                    <span className="skeleton" style={{ width: '60%' }} />
                  </td>
                  <td>
                    <span className="skeleton" style={{ width: '75%' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !result && (
        <div className="empty">
          <p>Configure the instrument, location and parameters, then press</p>
          <p><strong>Compute dimensions</strong> to see the spec and drawings.</p>
        </div>
      )}

      {result && (
        <>
          {/* Top summary */}
          <div className="summary-card">
            <h3>{result.meta.display_name}</h3>
            <p className="summary-coords">
              {result.lat.toFixed(3)}°N, {result.lon.toFixed(3)}°E
            </p>
            <p className="mini">{result.meta.description}</p>
          </div>

          {/* Numeric spec table */}
          <div className="card">
            <h4>Numeric specification</h4>
            <table className="spec-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Value</th>
                  <th>Formula</th>
                </tr>
              </thead>
              <tbody>
                {result.values.map((v) => {
                  const open = expanded.has(v.key)
                  return (
                    <tr
                      key={v.key}
                      className="spec-row"
                      onClick={() => toggleRow(v.key)}
                    >
                      <td>
                        <span className="row-label">{v.label}</span>
                      </td>
                      <td className="cell-value">
                        {v.value.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })}{' '}
                        {v.unit}
                      </td>
                      <td>
                        <span className="formula">{v.formula}</span>
                        {open && <div className="ref">{v.reference}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="mini note">
              {result.meta.disclaimer}
            </p>
          </div>

          {/* Drawings */}
          <div className="card">
            <h4>Technical drawings</h4>
            <div className="drawing-grid">
              {svgViews.map(([key, markup]) => (
                <figure key={key}>
                  <figcaption>{svgViewLabel(key)}</figcaption>
                  <div
                    className="svg-box"
                    dangerouslySetInnerHTML={{ __html: markup }}
                  />
                </figure>
              ))}
            </div>
          </div>

          {/* References / methodology */}
          {result.meta.references && result.meta.references.length > 0 && (
            <div className="card">
              <h4>References &amp; derivation</h4>
              <ul className="reference-list">
                {result.meta.references.map((ref, i) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Comparison mode */}
          <div className="card">
            <div className="compare-head">
              <h4>Compare with another latitude</h4>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const next = !showCompare
                  setShowCompare(next)
                  if (next) compareMutation.mutate(compareLat)
                }}
              >
                {showCompare ? 'Hide' : `Compare vs ${compareLat}°N (Jaipur)`}
              </button>
            </div>
            {showCompare && (
              <ComparisonTable current={result} other={compareMutation.data} needLat={compareLat} onLatChange={setCompareLat} refetch={() => compareMutation.mutate(compareLat)} />
            )}
          </div>

          {/* Export */}
          <div className="card">
            <h4>Export</h4>
            <div className="export-row">
              <button className="btn btn-secondary" onClick={() => doExport('csv')}>
                CSV
              </button>
              <button className="btn btn-secondary" onClick={() => doExport('dxf')}>
                DXF
              </button>
              <button className="btn btn-secondary" onClick={() => doExport('pdf')}>
                PDF
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const docs = svgViews
                    .map(([key, markup]) =>
                      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">` +
                      `<text x="16" y="24" font-size="20" fill="#171717">${svgViewLabel(key)}</text>` +
                      markup +
                      `</svg>`,
                    )
                    .join('\n')
                  const blob = new Blob([docs], { type: 'image/svg+xml' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `yantragen_${result.yantra_type}_views.svg`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                SVG
              </button>
            </div>
            <p className="mini note">Exports are for fabrication / CAD use.</p>
          </div>
        </>
      )}
    </div>
  )
}

function ComparisonTable({
  current,
  other,
  needLat,
  onLatChange,
  refetch,
}: {
  current: DimensionsResponse
  other?: DimensionsResponse
  needLat: number
  onLatChange: (v: number) => void
  refetch: () => void
}) {
  // Compare the size parameter plus up to three representative values.
  const sizeKey = current.size_param.key
  const sampled = [sizeKey]
  for (const v of current.values) {
    if (sampled.length >= 4) break
    if (!sampled.includes(v.key)) sampled.push(v.key)
  }
  const rows = sampled
  const labelOf = (key: string) =>
    current.values.find((v) => v.key === key)?.label ?? key
  const valueOf = (spec: DimensionsResponse | undefined, key: string) =>
    spec?.values.find((v) => v.key === key)?.value

  const maxVal = Math.max(
    ...rows.map((k) => Math.max(valueOf(current, k) ?? 0, valueOf(other, k) ?? 0)),
  )

  return (
    <div className="compare-body">
      <div className="compare-controls">
        <label className="field-inline">
          <span>Compare latitude (°N):</span>
          <input
            type="number"
            step="0.1"
            value={needLat}
            onChange={(e) => onLatChange(Number(e.target.value))}
          />
          <button className="btn btn-secondary" onClick={refetch}>Apply</button>
        </label>
      </div>
      <table className="spec-table">
        <thead>
          <tr>
            <th>Quantity</th>
            <th>Your {current.lat.toFixed(1)}°N</th>
            <th>{needLat}°N</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((key) => {
            const yours = valueOf(current, key) ?? 0
            const theirs = valueOf(other, key) ?? 0
            const pctYours = (yours / maxVal) * 100
            const pctTheirs = (theirs / maxVal) * 100
            return (
              <tr key={key}>
                <td>{labelOf(key)}</td>
                <td>
                  {yours.toFixed(2)} {current.values.find((v) => v.key === key)?.unit}
                  <div className="bar-track">
                    <div className="bar yours" style={{ width: `${pctYours}%` }} />
                  </div>
                </td>
                <td>
                  {theirs.toFixed(2)} {current.values.find((v) => v.key === key)?.unit}
                  <div className="bar-track">
                    <div className="bar theirs" style={{ width: `${pctTheirs}%` }} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mini note">
        Same size parameter, different latitude — the instrument's angular
        geometry (tilt, altitudes) shifts as the site moves north or south.
      </p>
    </div>
  )
}
