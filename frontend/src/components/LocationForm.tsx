import { lazy, Suspense, useState, useCallback, useRef } from 'react'
import type { ReferenceSiteDto } from '../api/types'

const LocationMap = lazy(() => import('./LocationMap'))

interface LatLng {
  lat: number
  long: number
}

interface Props {
  sites: ReferenceSiteDto[]
  value: LatLng
  onChange: (v: LatLng) => void
  onNext: () => void
  yantraName?: string
  active?: boolean
}

// India extent (mirrors backend validation).
const RANGE = { lat: { min: 6, max: 37 }, long: { min: 68, max: 97 } }

function boundsError(lat: number, long: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(long)) {
    return 'Both coordinates are required.'
  }
  if (lat < RANGE.lat.min || lat > RANGE.lat.max) {
    return `Latitude must be ${RANGE.lat.min}°N–${RANGE.lat.max}°N (India).`
  }
  if (long < RANGE.long.min || long > RANGE.long.max) {
    return `Longitude must be ${RANGE.long.min}°E–${RANGE.long.max}°E (India).`
  }
  return null
}

function useGeolocation(onFound: (v: LatLng) => void) {
  const [gps, setGps] = useState<
    { state: 'idle' | 'locating' | 'done' | 'error'; message?: string } | undefined
  >()
  const onFoundRef = useRef(onFound)
  onFoundRef.current = onFound

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGps({ state: 'error', message: 'GPS is not supported by this browser.' })
      return
    }
    setGps({ state: 'locating', message: undefined })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ state: 'done', message: 'GPS location found.' })
        onFoundRef.current({
          lat: Number(pos.coords.latitude.toFixed(4)),
          long: Number(pos.coords.longitude.toFixed(4)),
        })
      },
      (err) => {
        setGps({
          state: 'error',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied. Please allow access in your browser.'
              : err.code === err.POSITION_UNAVAILABLE
                ? 'GPS position is unavailable right now.'
                : 'GPS lookup timed out. Please try again.',
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }, [])

  return { gps, locate }
}

function LocateButton({ onFound }: { onFound: (v: LatLng) => void }) {
  const { gps, locate } = useGeolocation(onFound)
  return (
    <>
      <button
        className="btn btn-secondary btn-block"
        type="button"
        onClick={() => locate()}
        disabled={gps?.state === 'locating'}
      >
        {gps?.state === 'locating' ? 'Locating…' : '📍 Use my current GPS location'}
      </button>
      {gps?.state === 'done' && <p className="map-hint gps-ok">GPS location detected.</p>}
      {gps?.state === 'error' && <p className="map-hint gps-err">{gps.message}</p>}
    </>
  )
}

export default function LocationForm({
  sites,
  value,
  onChange,
  onNext,
  yantraName,
  active = true,
}: Props) {
  const latErr = boundsError(value.lat, value.long)

  const handleSite = (id: string) => {
    const site = sites.find((s) => s.id === id)
    if (site) onChange({ lat: site.lat, long: site.lon })
  }

  return (
    <div>
      {yantraName && (
        <p className="chip">
          Building: <strong>{yantraName}</strong>
        </p>
      )}

      <LocateButton onFound={(v) => onChange(v)} />

      <p className="explain-note">
        <strong>Why it matters:</strong> the latitude of an observatory fixes
        every angle of a yantra — the gnomon's tilt toward the celestial pole,
        its height, and its hour scales. Longitude sets the offset of local
        apparent solar time from the reference meridian. Choose a historical
        observatory below, or place your own site within India.
      </p>

      <label className="field">
        <span className="field-label">Or pick a historical site</span>
        <select
          onChange={(e) => handleSite(e.target.value)}
          defaultValue=""
          aria-label="Historical observatory"
        >
          <option value="" disabled>
            — Reference observatory —
          </option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.lat.toFixed(1)}N, {s.lon.toFixed(1)}E)
            </option>
          ))}
        </select>
      </label>

      <div className="map-wrap">
        {active && (
          <Suspense
            fallback={<div className="viewer-loading">Loading map…</div>}
          >
            <LocationMap
              value={value}
              sites={sites}
              onChange={onChange}
              active={active}
            />
          </Suspense>
        )}
        <p className="map-hint">
          Click the map (India only), tap a gold pin for a historic observatory,
          or enter coordinates manually.
        </p>
      </div>

      <div className="coord-row">
        <label className="field">
          <span className="field-label">Latitude (°N)</span>
          <input
            type="number"
            step="0.0001"
            min={RANGE.lat.min}
            max={RANGE.lat.max}
            value={value.lat}
            aria-invalid={latErr ? 'true' : 'false'}
            onChange={(e) => onChange({ ...value, lat: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span className="field-label">Longitude (°E)</span>
          <input
            type="number"
            step="0.0001"
            min={RANGE.long.min}
            max={RANGE.long.max}
            value={value.long}
            aria-invalid={latErr ? 'true' : 'false'}
            onChange={(e) => onChange({ ...value, long: Number(e.target.value) })}
          />
        </label>
      </div>
      {latErr && (
        <p className="field-error" role="alert">
          {latErr}
        </p>
      )}

      <button
        className="btn btn-primary btn-block"
        onClick={onNext}
        disabled={Boolean(latErr)}
      >
        Continue to parameters →
      </button>
    </div>
  )
}