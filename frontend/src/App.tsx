import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  getInstruments,
  getReferenceSites,
  getDimensions,
} from './api/client'
import type {
  DimensionsResponse,
  DimensionsForm,
  InstrumentDto,
  ReferenceSiteDto,
} from './api/types'
import { dimensionsSchema } from './lib/schema'
import HeroSection from './components/HeroSection'
import InstrumentSelector from './components/InstrumentSelector'
import LocationForm from './components/LocationForm'
import ParameterPanel from './components/ParameterPanel'
import ResultsView from './components/ResultsView'
import HistorySection from './components/HistorySection'
import ChatBot from './components/ChatBot'
import NavBar from './components/NavBar'
import YantraDefinition from './components/YantraDefinition'
import Footer from './components/Footer'
import Yantra3DModal from './components/three/Yantra3DModal'
import {
  useGlobalSoundFeedback,
  useAudioUnlock,
} from './lib/soundFeedback'

type Step = 'yantra' | 'location' | 'parameters'

export default function App() {
  useGlobalSoundFeedback()
  useAudioUnlock()
  const [step, setStep] = useState<Step>('yantra')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [exploreType, setExploreType] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; long: number }>({
    lat: 26.9239,
    long: 75.8267,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [params, setParams] = useState<{
    sizeParam: number
    unit: 'm' | 'ft'
    referenceMeridian: 'ist' | 'ujjain' | 'greenwich'
  }>({ sizeParam: 22.6, unit: 'm', referenceMeridian: 'ist' })

  const instrumentsQ = useQuery({
    queryKey: ['instruments'],
    queryFn: getInstruments,
  })
  const sitesQ = useQuery({
    queryKey: ['reference-sites'],
    queryFn: getReferenceSites,
  })

  const instruments: InstrumentDto[] = instrumentsQ.data?.instruments ?? []
  const sites: ReferenceSiteDto[] = sitesQ.data?.sites ?? []

  const selected = instruments.find((i) => i.type === selectedType)
  const inExperience = step !== 'yantra' && selectedType !== null

  const computeMutation = useMutation({
    mutationFn: (form: DimensionsForm) => getDimensions(form),
  })

  const handleChooseYantra = (type: string) => {
    setSelectedType(type)
    computeMutation.reset()
    setFormError(null)
    setStep('location')
  }

  const handleNextToParameters = () => {
    setStep('parameters')
  }

  const handleBack = () => {
    computeMutation.reset()
    setFormError(null)
    if (step === 'parameters') setStep('location')
    else if (step === 'location') {
      setSelectedType(null)
      setStep('yantra')
    }
  }

  const handleCompute = () => {
    if (!selectedType) return
    const form: DimensionsForm = {
      yantraType: selectedType,
      lat: location.lat,
      long: location.long,
      sizeParam: params.sizeParam,
      unit: params.unit,
      referenceMeridian: params.referenceMeridian,
    }
    const parsed = dimensionsSchema.safeParse(form)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Please correct the form.')
      return
    }
    setFormError(null)
    computeMutation.reset()
    computeMutation.mutate(form)
  }

  const handlePickLocation = (lat: number, long: number) => {
    setLocation({ lat, long })
    setFormError(null)
    const el = document.getElementById('yantras')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (selectedType) setStep('location')
  }

  const exploreInstrument = selected
    ? instruments.find((i) => i.type === exploreType)
    : undefined

  const result: DimensionsResponse | undefined = computeMutation.data

  return (
    <div className="app">
      <NavBar />

      {!inExperience && (
        <HeroSection onPickLocation={handlePickLocation} defaultLoc={location} />
      )}

      {selected && (
        <YantraDefinition instrument={selected} location={location} params={params} />
      )}

      {!inExperience && (
        <section className="intro" id="about">
          <div className="intro-eyebrow">Ancient Indian Astronomy, Recreated</div>
          <h2 className="intro-title">What is a Yantra?</h2>
          <p className="intro-body">
            In the Sanskrit tradition, a <strong>yantra</strong> is an
            astronomical instrument — a precision device of stone or brass used
            to observe the Sun, Moon, stars and planets. Built by Maharaja Sawai
            Jai Singh II in the 18th century at observatories such as Jaipur and
            Delhi, these instruments map the geometry of the celestial sphere
            into physical form: curved arcs, tilted dials and towering gnomon
            walls that turn the sky's motion into readable time, angles and
            directions. Choose a yantra below to experience how it works and was
            used.
          </p>
        </section>
      )}

      <div className={`wizard step-${step}`} id="yantras">
        {/* Step 1 — choose yantra */}
        <section className="wizard-panel">
          <div className="wizard-header">
            <span className="panel-title">Experience all Yantras</span>
            <span className="wizard-hint">Pick one to begin</span>
          </div>
          <InstrumentSelector
            instruments={instruments}
            selectedType={selectedType}
            onSelect={handleChooseYantra}
            onExplore={setExploreType}
          />
        </section>

        {/* Step 2 — location */}
        <section className="wizard-panel">
          <div className="wizard-header">
            <span className="panel-title">Choose location (India)</span>
            <button className="btn btn-ghost" onClick={handleBack}>
              ← Back
            </button>
          </div>
          <LocationForm
            sites={sites}
            value={location}
            onChange={setLocation}
            onNext={handleNextToParameters}
            yantraName={selected?.name}
            active={step === 'location'}
          />
        </section>

        {/* Step 3 — parameters */}
        <section className="wizard-panel">
          <div className="wizard-header">
            <span className="panel-title">Parameters &amp; compute</span>
            <button className="btn btn-ghost" onClick={handleBack}>
              ← Back
            </button>
          </div>
          <ParameterPanel
            value={params}
            onChange={setParams}
            instrument={selected}
          />
          <div className="controls-footer">
            <button
              className="btn btn-primary btn-block"
              onClick={handleCompute}
              disabled={
                computeMutation.isPending || !selected || selected.status === 'coming_soon'
              }
            >
              {computeMutation.isPending
                ? 'Computing…'
                : selected?.status === 'coming_soon'
                  ? 'Coming soon'
                  : 'Compute dimensions'}
            </button>
            {computeMutation.isError && (
              <p className="error" role="alert">
                {(computeMutation.error as Error).message}
              </p>
            )}
            {formError && (
              <p className="error" role="alert">
                {formError}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Individual result */}
      {result && (
        <section className="result-block">
          <ResultsView
            result={result}
            loading={computeMutation.isPending}
            location={location}
            form={{
              yantraType: selectedType as string,
              lat: location.lat,
              long: location.long,
              sizeParam: params.sizeParam,
              unit: params.unit,
              referenceMeridian: params.referenceMeridian,
            }}
          />
        </section>
      )}

      {!inExperience && (
        <HistorySection instruments={instruments} activeType={selectedType} />
      )}

      <ChatBot />

      {exploreInstrument && (
        <Yantra3DModal
          instrument={exploreInstrument}
          location={location}
          params={params}
          onClose={() => setExploreType(null)}
        />
      )}

      {!inExperience && <Footer />}
    </div>
  )
}
