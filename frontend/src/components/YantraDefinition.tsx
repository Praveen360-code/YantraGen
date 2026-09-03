import { useState } from 'react'
import type { InstrumentDto } from '../api/types'
import Yantra3DModal from './three/Yantra3DModal'

interface Props {
  instrument: InstrumentDto
  location: { lat: number; long: number }
  params: {
    sizeParam: number
    unit: 'm' | 'ft'
    referenceMeridian: 'ist' | 'ujjain' | 'greenwich'
  }
}

export default function YantraDefinition({ instrument, location, params }: Props) {
  const [show3D, setShow3D] = useState(false)

  return (
    <>
      <section className="yantra-definition" id="about">
        <div className="yantra-definition-inner">
          <div className="yantra-definition-text">
            <div className="intro-eyebrow">About this Yantra</div>
            <h2 className="intro-title">{instrument.name}</h2>
            <p className="intro-body">{instrument.description}</p>
          </div>
          <div className="yantra-definition-action">
            <button className="btn btn-primary" onClick={() => setShow3D(true)}>
              Visualize in 3D
            </button>
          </div>
        </div>
      </section>

      {show3D && (
        <Yantra3DModal
          instrument={instrument}
          location={location}
          params={params}
          onClose={() => setShow3D(false)}
        />
      )}
    </>
  )
}
