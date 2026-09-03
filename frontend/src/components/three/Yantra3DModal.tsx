import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { InstrumentDto, DimensionsResponse, DimensionsForm } from '../../api/types'
import { getDimensions } from '../../api/client'
import Yantra3D from './Yantra3D'
import { buildDimensionMap } from './dimensions'

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

export default function Yantra3DModal({ instrument, location, params, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const form: DimensionsForm = {
    yantraType: instrument.type,
    lat: location.lat,
    long: location.long,
    sizeParam: params.sizeParam,
    unit: params.unit,
    referenceMeridian: params.referenceMeridian,
  }

  const dimsQ = useQuery<DimensionsResponse>({
    queryKey: ['3d-dimensions', instrument.type, location.lat, location.long, params.sizeParam],
    queryFn: () => getDimensions(form),
  })

  const dimensionMap = dimsQ.data
    ? buildDimensionMap(dimsQ.data.size_param, dimsQ.data.values)
    : null

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <div className="viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-head">
          <span className="panel-title">360° {instrument.name} — 3D</span>
          <button className="viewer-close" onClick={onClose} aria-label="Close 3D view">
            ×
          </button>
        </div>
        <div className="viewer-body">
          <div className="viewer-canvas">
            {dimensionMap ? (
              <Yantra3D type={instrument.type} dims={dimensionMap} />
            ) : (
              <div className="viewer-loading">Computing dimensions…</div>
            )}
          </div>
          <div className="viewer-panel">
            <h4 className="viewer-panel-title">Dimensions</h4>
            <p className="viewer-sub">
              {location.lat.toFixed(3)}°N, {location.long.toFixed(3)}°E · size{' '}
              {params.sizeParam} {params.unit}
            </p>
            {dimsQ.isLoading && <p className="viewer-loading">Loading…</p>}
            {dimsQ.isError && (
              <p className="viewer-error">Could not load dimensions.</p>
            )}
            {dimensionMap && (
              <ul className="dims-list">
                {dimensionMap.labels.map((l) => (
                  <li key={l.key} className="dims-item">
                    <span className="dims-label">{l.label}</span>
                    <span className="dims-value">
                      {l.value.toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })}{' '}
                      {l.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p className="viewer-hint">
          Drag to rotate 360° · Scroll to zoom · auto-rotates · model scaled ≈ metres
        </p>
      </div>
    </div>
  )
}
