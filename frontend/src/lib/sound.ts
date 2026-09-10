// Web Audio synthesized sound engine.
//
// All feedback sounds are generated procedurally (no asset files) with a
// brass / mechanical-instrument timbre to match the visual design — soft
// struck partials for clicks, a light metallic tick for hovers, and a
// filtered-noise whoosh scaled to 3D drag velocity.
//
// The AudioContext is created lazily on the first user gesture (browsers
// require it) and all sounds are pre-built as short buffer/oscillator
// recipes so playback is instant.

class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private muted = false

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('yantra-muted')
      // Default to muted on first visit so the ambient cues are opt-in.
      this.muted = saved === null || saved === '1'
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AC) return null
      this.ctx = new AC()
      const compressor = this.ctx.createDynamicsCompressor()
      compressor.threshold.value = -18
      compressor.knee.value = 20
      compressor.ratio.value = 4
      compressor.connect(this.ctx.destination)
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.9
      this.master.connect(compressor)
    }
    if (this.ctx.state === 'suspended') {
      // Resume inside a user gesture; safe to attempt each call.
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  setMuted(m: boolean) {
    this.muted = m
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('yantra-muted', m ? '1' : '0')
    }
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.01)
    }
  }

  isMuted() {
    return this.muted
  }

  // Return the context only when it is fully running, so no sounds are
  // queued while suspended (which could all fire at once on resume).
  private ready(): AudioContext | null {
    const ctx = this.ensure()
    if (!ctx) return null
    if (ctx.state !== 'running') return null
    return ctx
  }

  /** Force-initialise / resume the context (call on a user gesture). */
  unlock() {
    this.ensure()
  }

  // ---- low-level helpers ----

  private partial(
    freq: number,
    gain: number,
    attack: number,
    decay: number,
    type: OscillatorType = 'sine',
  ) {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    const t0 = ctx.currentTime
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(gain, t0 + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t0)
    osc.stop(t0 + decay + 0.02)
  }

  private noiseBurst(duration: number, cutoff0: number, cutoff1: number, gain: number, decay: number) {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const len = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(cutoff0, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, cutoff1), ctx.currentTime + duration)
    filter.Q.value = 0.8
    const g = ctx.createGain()
    const t0 = ctx.currentTime
    g.gain.setValueAtTime(gain, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    src.start(t0)
    src.stop(t0 + decay)
  }

  /** Crisp brass "pop" for clicks (<150ms). */
  click() {
    const ctx = this.ready()
    if (!ctx) return
    this.partial(420, 0.28, 0.002, 0.11, 'triangle')
    this.partial(1260, 0.16, 0.002, 0.07, 'sine')
    this.partial(2100, 0.08, 0.002, 0.05, 'sine')
    this.noiseBurst(0.03, 1800, 900, 0.05, 0.03)
  }

  /** Softer metallic hover tick, distinct from the click pop. */
  hoverTick() {
    const ctx = this.ready()
    if (!ctx) return
    this.partial(880, 0.1, 0.004, 0.06, 'sine')
    this.partial(1760, 0.05, 0.004, 0.04, 'sine')
  }

  /** Whoosh/rustle for 3D dragging, scaled to velocity in [0,1]. */
  whoosh(velocity: number) {
    const ctx = this.ready()
    if (!ctx) return
    const v = Math.min(1, Math.max(0, velocity))
    if (v < 0.05) return
    const g = 0.05 + v * 0.12
    const cut = 600 + v * 2600
    this.noiseBurst(0.12 + v * 0.1, cut, cut * 0.6, g, 0.14 + v * 0.08)
  }

  /** Harmonic chime + shimmer when dimensions morph / labels lock on. */
  morph() {
    const ctx = this.ready()
    if (!ctx) return
    this.partial(523.25, 0.14, 0.006, 0.4, 'sine')
    this.partial(659.25, 0.1, 0.01, 0.45, 'sine')
    this.partial(783.99, 0.08, 0.016, 0.5, 'sine')
  }
}

export const sound = new SoundEngine()
