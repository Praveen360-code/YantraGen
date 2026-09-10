import { lazy, Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDimensions } from '../api/client'
import type { DimensionsResponse } from '../api/types'
import { useTheme } from '../lib/useTheme'
import { buildDimensionMap } from './three/dimensions'

const Yantra3D = lazy(() => import('./three/Yantra3D'))

interface Props {
  onPickLocation: (lat: number, long: number) => void
  defaultLoc: { lat: number; long: number }
}

const EMPTY = { sizeParam: 22.6, unit: 'm', byKey: {}, labels: [] }

const INDIA = { lat: { min: 6, max: 37 }, long: { min: 68, max: 97 } }

function coordsError(lat: number, long: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(long)) {
    return 'Enter a latitude and longitude before continuing.'
  }
  if (lat < INDIA.lat.min || lat > INDIA.lat.max) {
    return `Latitude must be between ${INDIA.lat.min}°N and ${INDIA.lat.max}°N (India).`
  }
  if (long < INDIA.long.min || long > INDIA.long.max) {
    return `Longitude must be between ${INDIA.long.min}°E and ${INDIA.long.max}°E (India).`
  }
  return null
}

export default function HeroSection({ onPickLocation, defaultLoc }: Props) {
  const [lat, setLat] = useState<number>(defaultLoc.lat)
  const [long, setLong] = useState<number>(defaultLoc.long)
  const [error, setError] = useState<string | null>(null)
  const theme = useTheme()

  const heroQ = useQuery<DimensionsResponse>({
    queryKey: ['hero-samrat', defaultLoc.lat, defaultLoc.long, 22.6],
    queryFn: () =>
      getDimensions({
        yantraType: 'samrat',
        lat: defaultLoc.lat,
        long: defaultLoc.long,
        sizeParam: 22.6,
        unit: 'm',
        referenceMeridian: 'ist',
      }),
  })

  const dims = heroQ.data
    ? buildDimensionMap(heroQ.data.size_param, heroQ.data.values)
    : EMPTY

  const build = () => {
    const err = coordsError(Number(lat), Number(long))
    if (err) {
      setError(err)
      return
    }
    setError(null)
    onPickLocation(Number(lat), Number(long))
  }

  const heroFallback = (
    <div
      className="hero-canvas"
      style={{
        background:
          theme === 'dark'
            ? 'radial-gradient(circle at 50% 40%, #121215 0%, #0b0b0d 70%)'
            : 'radial-gradient(circle at 50% 40%, #f7f0e1 0%, #e7dcc4 70%)',
      }}
      aria-hidden="true"
    />
  )

  return (
    <section className="hero" id="home">
      <Suspense fallback={heroFallback}>
        <div className="hero-canvas" aria-hidden="true">
          <Yantra3D
            type="samrat"
            dims={dims}
            theme={theme}
            showLabels={false}
            autoRotate
            cinematicIntro
            morphToken={heroQ.dataUpdatedAt}
          />
        </div>
      </Suspense>
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-content">
        <p className="hero-eyebrow">Ancient Indian Astronomy, Recreated</p>
        <h1 className="hero-title">The geometry of the sky, carved in stone.</h1>
        <p className="hero-sub">
          YantraGen reconstructs the monumental instruments of Jantar Mantar —
          the Samrat, Rama, Digamsa and more — computing their exact dimensions
          for any latitude and longitude in India, and rendering each precision
          sundial and celestial ring in 3D.
        </p>

        <form
          className="hero-cta"
          onSubmit={(e) => {
            e.preventDefault()
            build()
          }}
          noValidate
        >
          <label className="hero-field">
            <span>Latitude °N</span>
            <input
              type="number"
              min={INDIA.lat.min}
              max={INDIA.lat.max}
              step="0.0001"
              value={lat}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'hero-coords-error' : undefined}
              onChange={(e) => {
                setLat(Number(e.target.value))
                if (error) setError(null)
              }}
              aria-label="Latitude"
            />
          </label>
          <label className="hero-field">
            <span>Longitude °E</span>
            <input
              type="number"
              min={INDIA.long.min}
              max={INDIA.long.max}
              step="0.0001"
              value={long}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'hero-coords-error' : undefined}
              onChange={(e) => {
                setLong(Number(e.target.value))
                if (error) setError(null)
              }}
              aria-label="Longitude"
            />
          </label>
          <button className="btn btn-hero" type="submit">
            Build my instruments
          </button>
        </form>

        {error && (
          <p className="field-error" id="hero-coords-error" role="alert">
            {error}
          </p>
        )}

        <p className="hero-cta-note">
          <strong>Why the coordinates matter:</strong> latitude fixes every
          angle of the instrument — its tilt toward the pole, its gnomon
          height, its hour scales — while longitude sets the time correction
          from the reference meridian. The observatories of Jai Singh II stand
          at the precise latitudes this geometry demands.
        </p>

        <div className="hero-links">
          <button onClick={() => onPickLocation(26.9239, 75.8267)}>Jaipur</button>
          <button onClick={() => onPickLocation(28.6271, 77.2166)}>Delhi</button>
          <button onClick={() => onPickLocation(23.1765, 75.7885)}>Ujjain</button>
          <button onClick={() => onPickLocation(25.3176, 82.9739)}>Varanasi</button>
          <span className="hero-links-hint">or tap a map pin below</span>
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true">
        <span>Scroll to explore</span>
        <span className="hero-scroll-line" />
      </div>
    </section>
  )
}