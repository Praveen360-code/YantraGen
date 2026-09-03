import type { InstrumentDto } from '../api/types'
import { Thumbnail } from './Thumbnail'

interface Props {
  instruments: InstrumentDto[]
  selectedType: string | null
  onSelect: (type: string) => void
}

export default function InstrumentSelector({
  instruments,
  selectedType,
  onSelect,
}: Props) {
  return (
    <div className="experience-grid">
      {instruments.map((inst) => {
        const active = inst.type === selectedType
        return (
          <button
            key={inst.type}
            className={`yantra-card${active ? ' active' : ''}`}
            onClick={() => onSelect(inst.type)}
            disabled={inst.status === 'coming_soon'}
            title={inst.description}
          >
            <div className="yantra-thumb">
              <Thumbnail type={inst.type} />
            </div>
            <span className="yantra-name">{inst.name}</span>
            {inst.status === 'coming_soon' && (
              <span className="badge">coming soon</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
