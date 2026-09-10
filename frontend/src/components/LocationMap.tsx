import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import type { ReferenceSiteDto } from '../api/types'

interface LatLng {
  lat: number
  long: number
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
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    [],
  )
  return <Marker position={position} icon={icon} />
}

const SITE_ICON = L.divIcon({
  className: 'site-marker',
  html: '<span data-sound-click></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function SiteMarkers({
  sites,
  onPick,
}: {
  sites: ReferenceSiteDto[]
  onPick: (s: ReferenceSiteDto) => void
}) {
  return (
    <>
      {sites.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lon]}
          icon={SITE_ICON}
          eventHandlers={{ click: () => onPick(s) }}
        >
          <Popup>
            <strong>{s.name}</strong>
            <br />
            {s.lat.toFixed(3)}°N, {s.lon.toFixed(3)}°E
            <br />
            <span className="site-popup-note">{s.note}</span>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

/**
 * Lazily-loaded interactive map. Kept in its own module so the Leaflet
 * bundle (and its CSS/tiles) load only when the location step is reached.
 */
export default function LocationMap({
  value,
  sites,
  onChange,
  active,
}: {
  value: LatLng
  sites: ReferenceSiteDto[]
  onChange: (v: LatLng) => void
  active: boolean
}) {
  if (!active) return null
  return (
    <MapContainer
      center={[value.lat, value.long]}
      zoom={5}
      minZoom={4}
      style={{ height: '100%', width: '100%' }}
      maxBounds={INDIA_BOUNDS}
      maxBoundsViscosity={1.0}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Recenter lat={value.lat} long={value.long} />
      <ClickHandler onChange={onChange} />
      <SiteMarkers
        sites={sites}
        onPick={(s) => onChange({ lat: s.lat, long: s.lon })}
      />
      <MarkerView position={[value.lat, value.long]} />
    </MapContainer>
  )
}