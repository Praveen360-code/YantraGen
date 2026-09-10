import { useEffect, useRef, useState } from 'react'

type Point3 = [number, number, number]

interface Star {
  x: number
  y: number
  r: number
  base: number
  phase: number
  speed: number
  depth: number
}

/* A frozen but visually pleasing pose used when reduced motion is active. */
const STATIC_T = 14

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

const makeStars = (n: number): Star[] =>
  Array.from({ length: n }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.5 + Math.random() * 1.05,
    base: 0.18 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 1.8,
    depth: 0.2 + Math.random() * 0.8,
  }))

type IconKind = 'samrat' | 'chaapa' | 'nadi' | 'rasa' | 'gola'

interface SkySpot {
  kind: IconKind
  x: number
  y: number
  s: number
  ph: number
}

const ICON_KINDS: IconKind[] = ['gola', 'nadi', 'samrat', 'rasa', 'chaapa']

// Horizontal gaps in the navbar strip that are free of DOM content: the logo/
// title (left), the hamburger (left on mobile) and the link+toggle cluster
// (right). Icons are only ever placed inside these gaps so they never sit
// behind or over the brand, the nav links or the theme/sound toggles.
const navZones = (canvas: HTMLCanvasElement, W: number): Array<[number, number]> => {
  const nav = canvas.closest('.navbar')
  const base = canvas.getBoundingClientRect().left
  const interval = (sel: string): [number, number] | null => {
    const el = nav?.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return null
    return [r.left - base, r.right - base]
  }
  const obs = [interval('.navbar-brand'), interval('.navbar-hamburger'), interval('.navbar-links')]
    .filter((o): o is [number, number] => o !== null)
    .sort((a, b) => a[0] - b[0])
  const gaps: Array<[number, number]> = []
  let cursor = 6
  for (const [l, r] of obs) {
    if (l > cursor + 18) gaps.push([cursor, l - 10])
    cursor = Math.max(cursor, r + 16)
  }
  if (W - cursor > 18) gaps.push([cursor, W - 6])
  return gaps.filter(([a, b]) => b - a >= 26)
}

const generateSpots = (canvas: HTMLCanvasElement, W: number, H: number, n: number): SkySpot[] => {
  const gaps = navZones(canvas, W)
  if (!gaps.length) return []
  const total = gaps.reduce((sum, [a, b]) => sum + (b - a), 0)
  const pickGap = () => {
    let pick = Math.random() * total
    for (let i = 0; i < gaps.length; i++) {
      const [a, b] = gaps[i]
      if (pick <= b - a) return i
      pick -= b - a
    }
    return gaps.length - 1
  }
  const spots: SkySpot[] = []
  for (let i = 0; i < n; i++) {
    const [a, b] = gaps[pickGap()]
    const x = a + Math.random() * (b - a)
    const y = 12 + Math.random() * Math.max(12, H - 26)
    spots.push({
      kind: ICON_KINDS[Math.floor(Math.random() * ICON_KINDS.length)],
      x,
      y,
      s: 5.5 + Math.random() * 3.5,
      ph: Math.random() * Math.PI * 2,
    })
  }
  // Enforce a little breathing room between icons so they don't pile up.
  const spaced: SkySpot[] = []
  for (const cand of spots) {
    let chosen = cand
    for (let attempt = 0; attempt < 12; attempt++) {
      const [a, b] = gaps[pickGap()]
      const x = a + Math.random() * (b - a)
      const y = 12 + Math.random() * Math.max(12, H - 26)
      const probe: SkySpot = { ...cand, x, y }
      if (spaced.every((p) => Math.hypot(p.x - probe.x, p.y - probe.y) >= 26)) {
        chosen = probe
        break
      }
    }
    spaced.push(chosen)
  }
  return spaced
}

const ringPoints = (u: Point3, v: Point3, n = 44): Point3[] => {
  const pts: Point3[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    pts.push([u[0] * ca + v[0] * sa, u[1] * ca + v[1] * sa, u[2] * ca + v[2] * sa])
  }
  return pts
}

const project = (
  p: Point3,
  R: number,
  theta: number,
  phi: number,
  cx: number,
  cy: number,
): [number, number] => {
  const [x, y, z] = p
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const rx = x * c + z * s
  const rz = -x * s + z * c
  const cp = Math.cos(phi)
  const sp = Math.sin(phi)
  const ry = y * cp - rz * sp
  const rzz = y * sp + rz * cp
  return [cx + rx * R, cy - ry * R + rzz * R * 0.2]
}

const strokePath = (ctx: CanvasRenderingContext2D, pts: [number, number][]) => {
  if (!pts.length) return
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.stroke()
}

const drawArmillary = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  theta: number,
  phi: number,
  ringColor: string,
  axisColor: string,
) => {
  const TILT = 0.41
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.strokeStyle = ringColor
  const rings: [Point3, Point3][] = [
    [
      [1, 0, 0],
      [0, 0, 1],
    ],
    [
      [0, 0, 1],
      [0, 1, 0],
    ],
    [
      [1, 0, 0],
      [0, -Math.sin(TILT), Math.cos(TILT)],
    ],
  ]
  for (const [u, v] of rings) {
    strokePath(ctx, ringPoints(u, v).map((p) => project(p, R, theta, phi, cx, cy)))
  }
  ctx.strokeStyle = axisColor
  strokePath(ctx, [
    project([0, -1, 0], R, theta, phi, cx, cy),
    project([0, 1, 0], R, theta, phi, cx, cy),
  ])
}

const renderNight = (
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  dpr: number,
  t: number,
  nx: number,
  ny: number,
  stars: Star[],
) => {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0a0a0c')
  grad.addColorStop(0.55, '#101013')
  grad.addColorStop(1, '#121216')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.globalCompositeOperation = 'lighter'
  const px = nx * W
  const py = ny * H
  for (const st of stars) {
    const sx = st.x * W + (nx - 0.5) * st.depth * 10
    const sy = st.y * H
    const pulse = 0.5 + 0.5 * Math.sin(t * st.speed + st.phase)
    let a = st.base * (0.3 + 0.7 * pulse)
    const d = Math.hypot(sx - px, sy - py)
    if (d < 44) a += 0.4 * (1 - d / 44)
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a)})`
    ctx.beginPath()
    ctx.arc(sx, sy, st.r, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 2; i++) {
    const spd = 0.0045 + i * 0.0016
    const prog = (t * spd + i * 0.37) % 1
    const x = prog * (W + 90) - 45
    const y = H * (0.14 + 0.2 * Math.sin(t * 0.06 + i * 2.4))
    const a = 0.18 * (0.55 + 0.45 * Math.sin(t * 0.45 + i * 3))
    const tx = x - 30 - i * 12
    const ty = y - 7 - i * 3
    const lg = ctx.createLinearGradient(x, y, tx, ty)
    lg.addColorStop(0, `rgba(255,255,255,${a})`)
    lg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.strokeStyle = lg
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(tx, ty)
    ctx.stroke()
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a + 0.25)})`
    ctx.beginPath()
    ctx.arc(x, y, 1.1, 0, Math.PI * 2)
    ctx.fill()
  }

  const cx = Math.max(84, Math.min(W * 0.082, 176)) + (nx - 0.5) * -6
  drawArmillary(ctx, cx, H / 2, 20, t * 0.05, -0.14, 'rgba(235,237,243,0.5)', 'rgba(235,237,243,0.26)')

  ctx.globalCompositeOperation = 'source-over'
}

const renderDay = (
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  dpr: number,
  t: number,
  nx: number,
  spots: SkySpot[],
) => {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#cfe6f4')
  grad.addColorStop(0.42, '#e3eef7')
  grad.addColorStop(0.78, '#f6efe1')
  grad.addColorStop(1, '#f0e2ca')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Soft drifting gauze clouds, very faint, to give the sky a sense of life.
  ctx.globalAlpha = 0.28
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 5; i++) {
    const cxp = ((i * 0.37 + t * 0.006) % 1.25 - 0.12) * W
    const cyp = H * (0.12 + 0.2 * (i % 3))
    const cw = 40 + ((i * 53) % 44)
    ctx.beginPath()
    ctx.ellipse(cxp, cyp, cw, 7, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Flat yantra icon palette (warm ochre / terracotta, no cartoon fills).
  const LINE = 'rgba(139,94,52,0.85)'
  const FILL = 'rgba(214,166,108,0.30)'
  const SPOKE = 'rgba(150,82,47,0.62)'

  const icon = (x: number, y: number, bob: number, draw: (c: CanvasRenderingContext2D) => void) => {
    ctx.save()
    ctx.translate(x, y + bob)
    ctx.rotate(Math.sin(bob * 0.6 + 0.8) * 0.04)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    draw(ctx)
    ctx.restore()
  }

  // Samrat Yantra icon — equinoctial triangle gnomon + double quadrant arc.
  const drawSamrat = (c: CanvasRenderingContext2D, s: number) => {
    c.strokeStyle = LINE
    c.lineWidth = 1.5
    c.beginPath()
    c.moveTo(s * 0.85, s * 0.7)
    c.lineTo(-s * 0.9, s * 0.7)
    c.lineTo(-s * 0.9, -s * 0.75)
    c.closePath()
    c.fillStyle = FILL
    c.fill()
    c.stroke()
    c.lineWidth = 1.3
    c.beginPath()
    c.arc(s * 0.62, s * 0.7, s * 1.05, -Math.PI / 2, Math.PI / 2)
    c.stroke()
    c.beginPath()
    c.arc(s * 0.54, s * 0.7, s * 0.92, -Math.PI / 2, Math.PI / 2)
    c.stroke()
  }

  // Chaapa Yantra icon — semicircular bow + chord + central needle.
  const drawChaapa = (c: CanvasRenderingContext2D, s: number) => {
    c.strokeStyle = LINE
    c.lineWidth = 1.6
    c.beginPath()
    c.arc(0, s * 0.3, s * 0.95, Math.PI, 2 * Math.PI)
    c.stroke()
    c.lineWidth = 1.2
    c.beginPath()
    c.moveTo(-s * 0.95, s * 0.3)
    c.lineTo(s * 0.95, s * 0.3)
    c.stroke()
    c.strokeStyle = SPOKE
    c.lineWidth = 1.3
    c.beginPath()
    c.moveTo(0, s * 0.3)
    c.lineTo(0, -s * 0.55)
    c.stroke()
    c.beginPath()
    c.arc(0, -s * 0.58, s * 0.12, 0, 2 * Math.PI)
    c.fillStyle = LINE
    c.fill()
  }

  // Nadi Valaya icon — disc dial + the tilted gnomon rod crossing its face.
  const drawNadiValaya = (c: CanvasRenderingContext2D, s: number) => {
    c.strokeStyle = LINE
    c.lineWidth = 1.5
    c.beginPath()
    c.arc(0, 0, s * 0.95, 0, 2 * Math.PI)
    c.fillStyle = FILL
    c.fill()
    c.stroke()
    c.lineWidth = 1
    c.beginPath()
    c.arc(0, 0, s * 0.62, 0, 2 * Math.PI)
    c.strokeStyle = SPOKE
    c.stroke()
    c.strokeStyle = LINE
    c.lineWidth = 1.5
    c.beginPath()
    c.moveTo(-s * 0.7, s * 0.15)
    c.lineTo(s * 0.7, -s * 0.15)
    c.stroke()
  }

  // Rasivalaya icon — zodiac wheel: hub circle + ring of twelve dial dots.
  const drawRasivalaya = (c: CanvasRenderingContext2D, s: number) => {
    c.strokeStyle = LINE
    c.lineWidth = 1.5
    c.beginPath()
    c.arc(0, 0, s, 0, 2 * Math.PI)
    c.fillStyle = FILL
    c.fill()
    c.stroke()
    c.fillStyle = SPOKE
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      c.beginPath()
      c.arc(Math.cos(a) * s * 0.72, Math.sin(a) * s * 0.72, s * 0.14, 0, 2 * Math.PI)
      c.fill()
    }
    c.beginPath()
    c.arc(0, 0, s * 0.2, 0, 2 * Math.PI)
    c.fillStyle = LINE
    c.fill()
  }

  // Gola Chakra icon — armillary sphere: meridian + equator + ecliptic rings.
  const drawGola = (c: CanvasRenderingContext2D, s: number) => {
    c.strokeStyle = LINE
    c.lineWidth = 1.4
    c.beginPath()
    c.arc(0, 0, s, 0, 2 * Math.PI)
    c.stroke()
    c.lineWidth = 1
    c.beginPath()
    c.ellipse(0, 0, s, s * 0.42, 0, 0, 2 * Math.PI)
    c.stroke()
    c.strokeStyle = SPOKE
    c.beginPath()
    c.ellipse(0, 0, s * 0.72, s, -0.35, 0, 2 * Math.PI)
    c.stroke()
    c.strokeStyle = LINE
    c.beginPath()
    c.moveTo(-s * 0.6, s * 0.8)
    c.lineTo(s * 0.62, -s * 0.8)
    c.stroke()
  }

  // Warm sun icon (no face), near the top-left.
  const drawSun = (c: CanvasRenderingContext2D, s: number) => {
    c.strokeStyle = 'rgba(194,124,46,0.7)'
    c.lineWidth = 1.3
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      c.beginPath()
      c.moveTo(Math.cos(a) * s * 1.3, Math.sin(a) * s * 1.3)
      c.lineTo(Math.cos(a) * s * 1.55, Math.sin(a) * s * 1.55)
      c.stroke()
    }
    const sg = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.15)
    sg.addColorStop(0, 'rgba(255,224,150,0.95)')
    sg.addColorStop(1, 'rgba(255,210,120,0.35)')
    c.fillStyle = sg
    c.beginPath()
    c.arc(0, 0, s * 1.15, 0, 2 * Math.PI)
    c.fill()
  }

  // Compose the floating icon scene — random spots placed only in gaps that
  // are free of the logo/title, links and toggles (see generateSpots).
  for (const d of spots) {
    const bob = Math.sin(t * 0.45 + d.ph) * 1.6
    const dx = d.x + (nx - 0.5) * -14
    const dy = d.y + bob * 0.3
    icon(dx, dy, bob, (c) => {
      if (d.kind === 'samrat') drawSamrat(c, d.s)
      else if (d.kind === 'chaapa') drawChaapa(c, d.s)
      else if (d.kind === 'nadi') drawNadiValaya(c, d.s)
      else if (d.kind === 'rasa') drawRasivalaya(c, d.s)
      else drawGola(c, d.s)
    })
  }

  icon(0.045 * W, 0.12 * H, t, (c) => drawSun(c, 7))
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])
  return reduced
}

function NightSky({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const lastT = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let W = 0
    let H = 0
    let dpr = 1
    let stars: Star[] = []
    const pointer = { nx: 0.5, ny: 0.5 }
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.max(1, rect.width)
      H = Math.max(1, rect.height)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      stars = makeStars(Math.max(50, Math.min(170, Math.round(W / 12))))
    }
    resize()
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.nx = clamp01((e.clientX - rect.left) / rect.width)
      pointer.ny = clamp01((e.clientY - rect.top) / rect.height)
    }
    const frame = (ts: number) => {
      lastT.current = ts / 1000
      renderNight(ctx, W, H, dpr, lastT.current, pointer.nx, pointer.ny, stars)
      raf = requestAnimationFrame(frame)
    }
    let raf = 0
    if (active) {
      if (reduced) renderNight(ctx, W, H, dpr, STATIC_T, pointer.nx, pointer.ny, stars)
      else raf = requestAnimationFrame(frame)
    } else {
      renderNight(ctx, W, H, dpr, lastT.current, pointer.nx, pointer.ny, stars)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('resize', resize)
    }
  }, [active, reduced])

  return <canvas ref={ref} className="nav-sky-canvas nav-sky-night" aria-hidden="true" />
}

function DaySky({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const lastT = useRef(0)
  const spots = useRef<SkySpot[]>([])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let W = 0
    let H = 0
    let dpr = 1
    const pointer = { nx: 0.5 }
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.max(1, rect.width)
      H = Math.max(1, rect.height)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      spots.current = generateSpots(canvas, W, H, 7)
    }
    resize()
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.nx = clamp01((e.clientX - rect.left) / rect.width)
    }
    const frame = (ts: number) => {
      lastT.current = ts / 1000
      renderDay(ctx, W, H, dpr, lastT.current, pointer.nx, spots.current)
      raf = requestAnimationFrame(frame)
    }
    let raf = 0
    if (active) {
      if (reduced) renderDay(ctx, W, H, dpr, STATIC_T, pointer.nx, spots.current)
      else raf = requestAnimationFrame(frame)
    } else {
      renderDay(ctx, W, H, dpr, lastT.current, pointer.nx, spots.current)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('resize', resize)
    }
  }, [active, reduced])

  return <canvas ref={ref} className="nav-sky-canvas nav-sky-day" aria-hidden="true" />
}

export default function NavSky({ theme }: { theme: 'dark' | 'light' }) {
  const dark = theme === 'dark'
  return (
    <div className="nav-sky" aria-hidden="true">
      <NightSky active={dark} />
      <DaySky active={!dark} />
    </div>
  )
}