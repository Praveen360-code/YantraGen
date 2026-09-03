import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { ReferenceSiteDto } from '../api/types'

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

// Restrict the map view to around India's extent.
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6, 68],
  [37, 97],
]

function ClickHandler({ onChange }: { onChange: (v: LatLng) => void }) {
  const map = useMap()
  useMapEvents({
    click(e) {
      const latlng = { lat: Number(e.latlng.lat.toFixed(4)), long: Number(e.latlng.lng.toFixed(4)) }
      onChange(latlng)
      map.setView([latlng.lat, latlng.long])
    },
  })
  return null
}

function Recenter({ lat, long }: LatLng) {
  const map = useMap()
  const initial = useRef(true)

  useEffect(() => {
    const t = window.setTimeout(() => {
      map.invalidateSize()
      map.setView([lat, long], map.getZoom())
    }, 0)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (initial.current) {
      initial.current = false
      return
    }
    // Debounce recentring so typing in the coordinate fields doesn't
    // fire a tile-download storm on every keystroke.
    const t = window.setTimeout(() => {
      map.setView([lat, long], map.getZoom())
    }, 400)
    return () => window.clearTimeout(t)
  }, [lat, long, map])

  return null
}

function MarkerView({ position }: { position: [number, number] }) {
  const icon = useMemo(
    () =>
      L.icon({
        iconUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    [],
  )
  return <Marker position={position} icon={icon} />
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

      <label className="field">
        <span className="field-label">Or pick a historical site</span>
        <select onChange={(e) => handleSite(e.target.value)} defaultValue="">
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
          <MapContainer
            center={[value.lat, value.long]}
            zoom={5}
            minZoom={4}
            style={{ height: '100%', width: '100%' }}
            maxBounds={INDIA_BOUNDS}
            maxBoundsViscosity={1.0}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recenter lat={value.lat} long={value.long} />
            <ClickHandler onChange={onChange} />
            <MarkerView position={[value.lat, value.long]} />
          </MapContainer>
        )}
        <p className="map-hint">
          Click the map (restricted to India) or enter coordinates manually.
        </p>
      </div>

      <div className="coord-row">
        <label className="field">
          <span className="field-label">Latitude (°N)</span>
          <input
            type="number"
            step="0.0001"
            min={6}
            max={37}
            value={value.lat}
            onChange={(e) => onChange({ ...value, lat: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span className="field-label">Longitude (°E)</span>
          <input
            type="number"
            step="0.0001"
            min={68}
            max={97}
            value={value.long}
            onChange={(e) => onChange({ ...value, long: Number(e.target.value) })}
          />
        </label>
      </div>

      <button className="btn btn-primary btn-block" onClick={onNext}>
        Continue to parameters →
      </button>
    </div>
  )
}
