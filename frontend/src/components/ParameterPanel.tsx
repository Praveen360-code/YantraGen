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

export default function ParameterPanel({ value, onChange, instrument }: Props) {
  const paramKey = instrument?.required_params?.[0]
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
          value={value.sizeParam}
          onChange={(e) => onChange({ ...value, sizeParam: Number(e.target.value) })}
        />
      </label>

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
      </div>

      {instrument?.status === 'coming_soon' && (
        <p className="note warn">
          This instrument is planned but not yet implemented.
        </p>
      )}
    </div>
  )
}
