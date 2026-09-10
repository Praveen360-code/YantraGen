import type { InstrumentDto } from '../api/types'
import { sizeParamLabel } from '../lib/labels'

interface Params {
  sizeParam: number
  unit: 'm' | 'ft'
  referenceMeridian: 'ist' | 'ujjain' | 'greenwich'
}

interface Props {
  value: Params
  onChange: (v: Params) => void
  instrument?: InstrumentDto
}

function sizeError(v: number): string | null {
  if (!Number.isFinite(v)) return 'Enter a size for the instrument.'
  if (v <= 0) return 'Size must be greater than zero.'
  if (v > 1000) return 'Size must be 1000 or less.'
  return null
}

const MERIDIAN_NOTE: Record<string, string> = {
  ist: 'IST (82.5°E) is India\u2019s standard meridian \u2014 the baseline used for clock time today.',
  ujjain: 'The classical meridian of Indian astronomy (75.7°E), the historical reference of the Jyotisha tradition.',
  greenwich: 'The 0° meridian \u2014 useful as a check on the longitude correction.',
}

export default function ParameterPanel({ value, onChange, instrument }: Props) {
  const paramKey = instrument?.required_params?.[0]
  const err = sizeError(value.sizeParam)

  return (
    <div>
      <label className="field">
        <span className="field-label">
          {sizeParamLabel(paramKey)}{' '}
          <em className="hint">({value.unit === 'm' ? 'm' : 'ft'})</em>
        </span>
        <input
          type="number"
          step="0.1"
          min={0.1}
          max={1000}
          value={value.sizeParam}
          aria-invalid={err ? 'true' : 'false'}
          aria-describedby={err ? 'size-param-error' : undefined}
          onChange={(e) => onChange({ ...value, sizeParam: Number(e.target.value) })}
        />
      </label>
      {err && (
        <p className="field-error" id="size-param-error" role="alert">
          {err}
        </p>
      )}
      <p className="explain-note">
        This is the instrument's characteristic dimension — typically the
        gnomon slant H. Every length scales linearly with H while every angle
        is fixed by the latitude, so a small study model and a monumental
        instrument share identical geometry.
      </p>

      <div className="segmented">
        <span className="field-label">Unit</span>
        <div>
          {(['m', 'ft'] as const).map((u) => (
            <button
              key={u}
              className={`seg${value.unit === u ? ' active' : ''}`}
              onClick={() => onChange({ ...value, unit: u })}
            >
              {u === 'm' ? 'metres' : 'feet'}
            </button>
          ))}
        </div>
      </div>

      <div className="segmented">
        <span className="field-label">Reference meridian (time)</span>
        <div>
          {(
            [
              ['ist', 'IST 82.5°E'],
              ['ujjain', 'Ujjain 75.7°E'],
              ['greenwich', 'Greenwich 0°'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={`seg${value.referenceMeridian === key ? ' active' : ''}`}
              onClick={() => onChange({ ...value, referenceMeridian: key })}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="map-hint" style={{ marginTop: 8 }}>
          {MERIDIAN_NOTE[value.referenceMeridian]} A yantra reads local
          apparent solar time; the offset from this meridian is
          (refMeridian − longitude) ÷ 15 hours.
        </p>
      </div>

      {instrument?.status === 'coming_soon' && (
        <p className="note warn">
          This instrument is planned but not yet implemented.
        </p>
      )}
    </div>
  )
}