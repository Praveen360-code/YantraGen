import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Text, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { Primitive } from './geometries'
import { buildYantra3D } from './geometries'
import type { DimensionMap } from './dimensions'
import { sound } from '../../lib/sound'

/** Respect the OS reduced-motion preference (disables auto-rotate / intro). */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
    return undefined
  }, [])
  return reduced
}

function easeOutBack(t: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

interface Props {
  type: string
  dims: DimensionMap
  ghost?: DimensionMap | null
  showLabels?: boolean
  explode?: number
  autoRotate?: boolean
  resetToken?: number
  controlsRef?: React.MutableRefObject<unknown> | null
  theme?: 'dark' | 'light'
  cinematicIntro?: boolean
  enableWhoosh?: boolean
  morphToken?: number
}

interface Override {
  color: string
  opacity: number
  transparent: boolean
}

const GHOST: Override = { color: '#f4f4f6', opacity: 0.42, transparent: true }

const DEG = Math.PI / 180

interface TriPrimitive {
  a: [number, number, number]
  b: [number, number, number]
  c: [number, number, number]
  thickness: number
}

function buildTriPrism(t: TriPrimitive) {
  const { a, b, c } = t
  const ha = t.thickness / 2
  const n = new THREE.Vector3()
    .subVectors(new THREE.Vector3(...b), new THREE.Vector3(...a))
    .cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c), new THREE.Vector3(...a)))
    .normalize()

  const pts = [a, b, c].map((p) => new THREE.Vector3(...p))
  const out = pts.map((p) => p.clone().addScaledVector(n, ha))
  const inn = pts.map((p) => p.clone().addScaledVector(n, -ha))
  const center = new THREE.Vector3()
  ;[...out, ...inn].forEach((p) => center.add(p))
  center.divideScalar(6)

  const positions: number[] = []
  const normals: number[] = []

  const pushTri = (p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, outward: THREE.Vector3) => {
    const face = new THREE.Vector3()
      .subVectors(p1, p0)
      .cross(new THREE.Vector3().subVectors(p2, p0))
      .normalize()
    const ordered = face.dot(outward) >= 0 ? [p0, p1, p2] : [p0, p2, p1]
    ordered.forEach((p) => {
      positions.push(p.x, p.y, p.z)
      normals.push(face.x, face.y, face.z)
    })
  }

  pushTri(out[0], out[1], out[2], n)
  pushTri(inn[0], inn[2], inn[1], n.clone().negate())

  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3
    const sideMid = new THREE.Vector3().addVectors(out[i], out[j]).addVectors(inn[i], inn[j]).divideScalar(4)
    const outward = sideMid.clone().sub(center).normalize()
    pushTri(out[i], out[j], inn[j], outward)
    pushTri(out[i], inn[j], inn[i], outward)
  }

  return { positions, normals }
}

function Label({
  position,
  text,
  dark,
}: {
  position: [number, number, number]
  text: string
  dark: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const start = useRef<number>(performance.now() / 1000)

  // Deterministic stagger so annotations "lock on" one after another.
  const delay = useMemo(
    () =>
      Math.min(
        (Math.abs(position[0]) * 1.7 + Math.abs(position[1]) * 0.9 + Math.abs(position[2]) * 1.3) *
          0.06,
        0.5,
      ),
    [position],
  )

  const line = useMemo(() => {
    const len = Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2)
    const range = Math.min(len, 1.35)
    const d = len > 1e-6 ? position.map((p) => p / len) : [0, -1, 0]
    const anchor = [-(d[0] * range), -(d[1] * range), -(d[2] * range)]
    const g = new THREE.BufferGeometry()
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0, anchor[0], anchor[1], anchor[2]], 3),
    )
    // Additive light-grey reads as a cool glow on the near-black sky; on the
    // daylight sky it would wash out, so fall back to a darker bronze with
    // normal blending.
    const m = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0,
      color: dark ? '#f4f4f6' : '#9b5f18',
      blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    })
    return { line: new THREE.Line(g, m), material: m }
  }, [position, dark])

  const lineMat = useRef<THREE.LineBasicMaterial>(line.material)

  useFrame((state) => {
    const t = (state.clock.elapsedTime - start.current - delay) / 0.55
    if (group.current) group.current.scale.setScalar(Math.max(0.001, t <= 0 ? 0 : t >= 1 ? 1 : easeOutBack(t)))
    if (lineMat.current) lineMat.current.opacity = Math.max(0, Math.min(1, t / 0.8)) * 0.85
  })

  return (
    <group ref={group} position={position}>
      <primitive object={line.line} />
      <Text
        position={[0, 0, 0]}
        fontSize={0.85}
        color={dark ? '#efeff1' : '#262118'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor={dark ? '#0e0e11' : '#f7f0e1'}
        strokeWidth={0}
      >
        {text}
      </Text>
    </group>
  )
}

function TriangleNode({
  p,
  dark,
  override,
  hideLabel,
}: {
  p: TriPrimitive & { color?: string; label?: string; labelPos?: [number, number, number] }
  dark: boolean
  override?: Override
  hideLabel?: boolean
}) {
  const geo = useMemo(() => {
    const { positions, normals } = buildTriPrism(p)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    return g
  }, [p])

  const labelPos =
    p.labelPos ??
    (() => {
      const mid = new THREE.Vector3()
        .addVectors(new THREE.Vector3(...p.a), new THREE.Vector3(...p.b))
        .add(new THREE.Vector3(...p.c))
        .divideScalar(3)
      return [mid.x, mid.y + 1.5, mid.z] as [number, number, number]
    })()

  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial
          color={override?.color ?? p.color ?? '#c8c9cd'}
          roughness={0.95}
          metalness={0.02}
          opacity={override?.opacity ?? 1}
          transparent={override?.transparent ?? false}
          depthWrite={!override}
        />
      </mesh>
      {!hideLabel && p.label && <Label position={labelPos} text={p.label} dark={dark} />}
    </group>
  )
}

function ArcNode({
  p,
  dark,
  override,
  hideLabel,
}: {
  p: Extract<Primitive, { kind: 'arc' }>
  dark: boolean
  override?: Override
  hideLabel?: boolean
}) {
  const start = (p.start ?? 0) * DEG
  const sweep = (p.sweep ?? 90) * DEG
  const labelPos = p.labelPos ?? (() => {
    const a = start + sweep / 2
    return [
      (p.pos?.[0] ?? 0) + Math.cos(a) * p.radius * 0.7,
      (p.pos?.[1] ?? 0) + Math.sin(a) * p.radius * 0.7,
      p.pos?.[2] ?? 0,
    ] as [number, number, number]
  })()
  return (
    <group rotation={p.rot}>
      <mesh position={p.pos} rotation={[0, 0, start]} castShadow>
        <torusGeometry args={[p.radius, p.tube, 14, 90, sweep]} />
        <meshStandardMaterial
          color={override?.color ?? p.color ?? '#f2f3f5'}
          metalness={0.6}
          roughness={0.32}
          opacity={override?.opacity ?? 1}
          transparent={override?.transparent ?? false}
          depthWrite={!override}
        />
      </mesh>
      {!hideLabel && p.label && (
        <group rotation={[0, 0, -start]}>
          <Label position={labelPos} text={p.label} dark={dark} />
        </group>
      )}
    </group>
  )
}

function LineNode({
  p,
  dark,
  override,
  hideLabel,
}: {
  p: Extract<Primitive, { kind: 'line' }>
  dark: boolean
  override?: Override
  hideLabel?: boolean
}) {
  const { pos, quat, len } = useMemo(() => {
    const s = new THREE.Vector3(...p.start)
    const e = new THREE.Vector3(...p.end)
    const dir = new THREE.Vector3().subVectors(e, s)
    const len = dir.length() + 0.001
    const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5)
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize(),
    )
    return { pos: [mid.x, mid.y, mid.z] as [number, number, number], quat: q, len }
  }, [p])
  const labelPos = p.labelPos ?? (pos[2] > 0 ? [pos[0], pos[1], pos[2] + 1.4] : [pos[0], pos[1], pos[2] - 1.4])
  return (
    <group>
      <mesh position={pos} quaternion={quat}>
        <cylinderGeometry args={[p.width ?? 0.08, p.width ?? 0.08, len, 8]} />
        <meshStandardMaterial
          color={override?.color ?? p.color ?? (dark ? '#b4b6bb' : '#69748c')}
          metalness={0.35}
          roughness={0.5}
          opacity={override?.opacity ?? 1}
          transparent={override?.transparent ?? false}
          depthWrite={!override}
        />
      </mesh>
      {!hideLabel && p.label && <Label position={labelPos} text={p.label} dark={dark} />}
    </group>
  )
}

function PrimitiveNode({
  p,
  dark,
  override,
  hideLabel,
}: {
  p: Primitive
  dark: boolean
  override?: Override
  hideLabel?: boolean
}) {
  switch (p.kind) {
    case 'triangle':
      return <TriangleNode p={p} dark={dark} override={override} hideLabel={hideLabel} />
    case 'arc':
      return <ArcNode p={p} dark={dark} override={override} hideLabel={hideLabel} />
    case 'line':
      return <LineNode p={p} dark={dark} override={override} hideLabel={hideLabel} />
    default:
      return <ShapeMesh p={p} dark={dark} override={override} hideLabel={hideLabel} />
  }
}

type ShapePrimitive = Exclude<Primitive, { kind: 'triangle' | 'arc' | 'line' }>

function ShapeMesh({
  p,
  dark,
  override,
  hideLabel,
}: {
  p: ShapePrimitive
  dark: boolean
  override?: Override
  hideLabel?: boolean
}) {
  const rot = (p as { rot?: [number, number, number] }).rot ?? [0, 0, 0]
  const pos = (p as { pos?: [number, number, number] }).pos ?? [0, 0, 0]
  const baseLabelPos = (p.labelPos ?? [pos[0], pos[1] + (p.kind === 'box' ? p.size[1] + 1.2 : 2.2), pos[2]]) as [number, number, number]
  const color = override?.color ?? p.color ?? '#c8c9cd'
  // Brushed-metal parts (the graphite equivalents of the old brass) get a
  // specular finish; everything else stays matte stone.
  const metalness =
    color === '#f2f3f5' || color === '#d5d6d9' || color === '#8e8f95' ? 0.6 : 0.02
  const roughness = metalness > 0.1 ? 0.32 : 0.9

  let geo: React.ReactElement | null = null
  switch (p.kind) {
    case 'box':
      geo = <boxGeometry args={p.size} />
      break
    case 'cylinder': {
      const segs = p.segments ?? 32
      const args: [number, number, number, number] | [number, number, number, number, number, boolean, number, number] =
        p.thetaStart !== undefined || p.thetaLength !== undefined || p.openEnded
          ? [
              p.radius,
              p.radius,
              p.height,
              segs,
              1,
              p.openEnded ?? false,
              (p.thetaStart ?? 0) * DEG,
              (p.thetaLength ?? 360) * DEG,
            ]
          : [p.radius, p.radius, p.height, segs]
      geo = <cylinderGeometry args={args} />
      break
    }
    case 'ring':
      geo = <torusGeometry args={[p.radius, p.tube, 16, 80]} />
      break
    case 'sphere':
      geo = <sphereGeometry args={[p.radius, 32, 32]} />
      break
    case 'disk':
      geo = <cylinderGeometry args={[p.radius, p.radius, 0.3, 48]} />
      break
    case 'cone':
      geo = <coneGeometry args={[p.radius, p.height, p.segments ?? 24]} />
      break
    default:
      return null
  }

  return (
    <group>
      <mesh position={pos} rotation={rot} castShadow receiveShadow>
        {geo}
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          opacity={override?.opacity ?? 1}
          transparent={override?.transparent ?? false}
          depthWrite={!override}
          side={p.kind === 'cylinder' && p.openEnded ? THREE.DoubleSide : THREE.FrontSide}
        />
      </mesh>
      {!hideLabel && p.label && <Label position={baseLabelPos} text={p.label} dark={dark} />}
    </group>
  )
}

function boundsOf(p: Primitive): number[] {
  switch (p.kind) {
    case 'box': {
      const h = p.size.map((s) => s / 2)
      return [Math.abs(p.pos[0]) + h[0], Math.abs(p.pos[1]) + h[1], Math.abs(p.pos[2]) + h[2]]
    }
    case 'cylinder': {
      const px = p.pos[0]
      const py = p.pos[1]
      const pz = p.pos[2]
      return [Math.abs(px) + p.radius, Math.abs(py) + p.height / 2, Math.abs(pz) + p.radius]
    }
    case 'disk':
    case 'cone': {
      const px = p.pos?.[0] ?? 0
      const py = p.pos?.[1] ?? 0
      const pz = p.pos?.[2] ?? 0
      const h = p.kind === 'disk' ? 0.3 : p.height / 2
      return [Math.abs(px) + p.radius, Math.abs(py) + h, Math.abs(pz) + p.radius]
    }
    case 'ring':
    case 'arc':
      return [Math.abs(p.pos?.[0] ?? 0) + p.radius + p.tube, Math.abs(p.pos?.[1] ?? 0) + p.radius + p.tube, Math.abs(p.pos?.[2] ?? 0) + p.radius + p.tube]
    case 'sphere':
      return [p.radius, (p.pos?.[1] ?? 0) + p.radius, p.radius]
    case 'line':
      return [
        (Math.abs(p.start[0]) + Math.abs(p.end[0])) / 2,
        (Math.abs(p.start[1]) + Math.abs(p.end[1])) / 2,
        (Math.abs(p.start[2]) + Math.abs(p.end[2])) / 2,
      ]
    case 'triangle':
      return [
        Math.max(...[p.a[0], p.b[0], p.c[0]].map(Math.abs)),
        Math.max(...[p.a[1], p.b[1], p.c[1]].map(Math.abs)),
        Math.max(...[p.a[2], p.b[2], p.c[2]].map(Math.abs)),
      ]
  }
}

function geometryFit(type: string, dims: DimensionMap): number {
  return buildYantra3D(type, dims).reduce((acc, p) => {
    const m = Math.max(...boundsOf(p))
    return Math.max(acc, m)
  }, 8)
}

function yBoundsOf(p: Primitive): [number, number] {
  switch (p.kind) {
    case 'box': {
      const py = p.pos[1]
      const h = p.size[1] / 2
      return [py - h, py + h]
    }
    case 'cylinder': {
      const py = p.pos[1]
      const h = p.height / 2
      return [py - h, py + h]
    }
    case 'disk': {
      const py = p.pos?.[1] ?? 0
      return [py - 0.3, py + 0.3]
    }
    case 'cone': {
      const py = p.pos?.[1] ?? 0
      const h = p.height / 2
      return [py - h, py + h]
    }
    case 'ring':
    case 'arc': {
      const py = p.pos?.[1] ?? 0
      return [py - (p.radius + p.tube), py + (p.radius + p.tube)]
    }
    case 'sphere': {
      const py = p.pos?.[1] ?? 0
      return [py - p.radius, py + p.radius]
    }
    case 'line':
      return [Math.min(p.start[1], p.end[1]), Math.max(p.start[1], p.end[1])]
    case 'triangle':
      return [Math.min(p.a[1], p.b[1], p.c[1]), Math.max(p.a[1], p.b[1], p.c[1])]
  }
}

function CameraRig({
  fit,
  resetToken,
  intro,
}: {
  fit: number
  resetToken?: number
  intro?: boolean
}) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as {
    target: THREE.Vector3
    update: () => void
  } | null
  const start = useRef<number | null>(null)
  const from = useRef(new THREE.Vector3())
  const to = useRef(new THREE.Vector3())

  useEffect(() => {
    const targetY = fit * 0.42
    const final = new THREE.Vector3(fit * 0.95, fit * 0.72, fit * 1.45)
    to.current.copy(final)
    if (intro) {
      // Cinematic push-in: begin farther back and slightly lower.
      from.current.copy(final).multiplyScalar(1.65)
      from.current.y = final.y * 0.8
      start.current = performance.now() / 1000
      camera.position.copy(from.current)
      camera.lookAt(0, targetY, 0)
    } else {
      camera.position.copy(final)
      camera.lookAt(0, targetY, 0)
      start.current = null
      if (controls) {
        controls.target.set(0, targetY, 0)
        controls.update()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken, fit, camera, controls, intro])

  useFrame(() => {
    if (start.current == null) return
    const t = Math.min(1, (performance.now() / 1000 - start.current) / 1.6)
    const e = easeInOutCubic(t)
    const targetY = fit * 0.42
    camera.position.lerpVectors(from.current, to.current, e)
    camera.lookAt(0, targetY, 0)
    if (controls) {
      controls.target.set(0, targetY, 0)
      controls.update()
    }
    if (t >= 1) start.current = null
  })

  return null
}

/** Faint whoosh/rustle scaled to drag velocity; silent when idle. */
function WhooshRig() {
  const controls = useThree((s) => s.controls) as unknown as {
    addEventListener: (type: string, listener: () => void) => void
    removeEventListener: (type: string, listener: () => void) => void
  } | null
  const active = useRef(false)
  const lastAz = useRef(0)
  const lastEl = useRef(0)
  const hasLast = useRef(false)
  const lastPlay = useRef(0)

  useEffect(() => {
    if (!controls) return
    const onStart = () => {
      active.current = true
    }
    const onEnd = () => {
      active.current = false
      hasLast.current = false
    }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controls])

  useFrame((state, dt) => {
    if (!active.current) {
      hasLast.current = false
      return
    }
    const dir = new THREE.Vector3()
    state.camera.getWorldDirection(dir)
    const az = Math.atan2(dir.x, dir.z)
    const el = Math.asin(Math.max(-1, Math.min(1, dir.y)))
    if (hasLast.current) {
      const wrap = Math.atan2(Math.sin(az - lastAz.current), Math.cos(az - lastAz.current))
      const rot = Math.sqrt(wrap * wrap + (el - lastEl.current) * (el - lastEl.current))
      const v = rot / Math.max(dt, 0.001)
      const vel = Math.max(0, Math.min(1, (v - 0.25) / 2))
      const now = performance.now() / 1000
      if (vel > 0.08 && now - lastPlay.current > 0.09) {
        sound.whoosh(vel)
        lastPlay.current = now
      }
    }
    lastAz.current = az
    lastEl.current = el
    hasLast.current = true
  })

  return null
}

/** One-shot gold particle burst that re-fires whenever the model re-morphs. */
function MorphBurst({ fit, dim }: { fit: number; dim?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)
  const start = useRef(performance.now() / 1000)

  const geo = useMemo(() => {
    const N = 48
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const r = fit * (0.25 + Math.random() * 0.6)
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.7
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [fit])

  useFrame(() => {
    const t = (performance.now() / 1000 - start.current) / 1.0
    if (t >= 1) {
      if (pointsRef.current) pointsRef.current.visible = false
      return
    }
    const p = Math.sin(t * Math.PI)
    if (matRef.current) matRef.current.opacity = p * (dim ? 0.28 : 0.55)
    if (pointsRef.current) pointsRef.current.scale.setScalar(0.5 + t * 1.4)
  })

  return (
    <points ref={pointsRef} geometry={geo} position={[0, fit * 0.35, 0]}>
      <pointsMaterial
        ref={matRef}
        color="#f5f5f6"
        size={fit * 0.045}
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** Gentle settle / wobble when the model's dimensions change. */
function MorphSettle({
  dims,
  fit,
  children,
}: {
  dims: DimensionMap
  fit: number
  children: React.ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = performance.now() / 1000
  }, [dims, fit])

  useFrame(() => {
    const g = ref.current
    if (!g) return
    if (startRef.current == null) startRef.current = performance.now() / 1000
    const t = Math.min(1, Math.max(0, (performance.now() / 1000 - startRef.current) / 0.5))
    const e = easeOutCubic(t)
    g.scale.setScalar(0.965 + 0.035 * e)
    g.rotation.y = Math.sin((1 - e) * Math.PI * 0.5) * 0.02
  })

  return <group ref={ref}>{children}</group>
}

/** Daytime-sky backdrop (light mode): soft sky-blue to parchment gradient. */
function SkyGradient() {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const cv = document.createElement('canvas')
    cv.width = 4
    cv.height = 256
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#c9e0f5')
    g.addColorStop(0.45, '#e7f0fb')
    g.addColorStop(0.78, '#f8f4ea')
    g.addColorStop(1, '#fdfbf3')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 4, 256)
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    scene.background = tex
    return () => {
      tex.dispose()
      if (scene.background === tex) scene.background = null
    }
  }, [scene])
  return null
}

function YantraModel({
  type,
  dims,
  ghost,
  showLabels,
  explode,
  dark,
  morphToken,
}: {
  type: string
  dims: DimensionMap
  ghost?: DimensionMap | null
  showLabels: boolean
  explode: number
  dark: boolean
  morphToken?: number
}) {
  const primitives = useMemo(
    () => buildYantra3D(type, dims, explode),
    [type, dims, explode],
  )
  const ghostPrims = useMemo(
    () => (ghost ? buildYantra3D(type, ghost, explode) : []),
    [type, ghost, explode],
  )
  const fit = geometryFit(type, dims)
  return (
    <group>
      <MorphSettle dims={dims} fit={fit}>
        {primitives.map((p, i) => (
          <PrimitiveNode key={i} p={p} dark={dark} hideLabel={!showLabels} />
        ))}
      </MorphSettle>
      {ghostPrims.map((p, i) => (
        <PrimitiveNode key={`ghost-${i}`} p={p} dark={dark} override={GHOST} hideLabel />
      ))}
      {morphToken !== undefined && <MorphBurst key={morphToken} fit={fit} dim={!dark} />}
      <Grid
        position={[0, -0.02, 0]}
        args={[fit * 3, fit * 3]}
        cellSize={Math.max(1, fit / 10)}
        cellThickness={0.5}
        cellColor={dark ? '#232328' : '#d6cbb0'}
        sectionSize={Math.max(2, fit / 3)}
        sectionThickness={0.9}
        sectionColor={dark ? '#3b3b41' : '#b3a08a'}
        fadeDistance={fit * 4.5}
        fadeStrength={1.2}
        infiniteGrid
      />
    </group>
  )
}

export default function Yantra3D({
  type,
  dims,
  ghost = null,
  showLabels = true,
  explode = 0,
  autoRotate = true,
  resetToken = 0,
  controlsRef,
  theme = 'dark',
  cinematicIntro = false,
  enableWhoosh = false,
  morphToken,
}: Props) {
  const fit = geometryFit(type, dims)
  const dark = theme === 'dark'
  const reducedMotion = useReducedMotion()
  const rotate = autoRotate && !reducedMotion
  const intro = cinematicIntro && !reducedMotion
  return (
    <Canvas
      key={`${type}-${dims.sizeParam}`}
      camera={{ position: [fit * 0.95, fit * 0.72, fit * 1.45], fov: 46 }}
      shadows
      gl={{ antialias: true }}
      dpr={[1, 1.8]}
    >
      <fog attach="fog" args={[dark ? '#0b0b0d' : '#e4edf7', fit * 4, fit * 9]} />

      {dark ? (
        <>
          <color attach="background" args={['#0b0b0d']} />
          <Stars radius={fit * 6} depth={fit * 2} count={600} factor={1.3} saturation={0} fade speed={0.4} />
        </>
      ) : (
        <SkyGradient />
      )}

      <ambientLight intensity={dark ? 0.55 : 0.7} color={dark ? '#dedfe3' : '#fff4e2'} />
      <hemisphereLight args={[dark ? '#9b9ca2' : '#fff2dd', dark ? '#2b2b30' : '#d8cdb8', dark ? 0.5 : 0.65]} />
      <directionalLight
        position={[fit * 1.4, fit * 2.1, fit * 0.15]}
        intensity={dark ? 1.7 : 1.45}
        color={dark ? '#f4f4f6' : '#ffd9a0'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={fit * 8}
        shadow-camera-left={-fit * 2.4}
        shadow-camera-right={fit * 2.4}
        shadow-camera-top={fit * 2.4}
        shadow-camera-bottom={-fit * 2.4}
      />
      <directionalLight position={[-fit, fit * 0.4, -fit]} intensity={dark ? 0.35 : 0.4} color="#c9ccd2" />

      <YantraModel
        type={type}
        dims={dims}
        ghost={ghost}
        showLabels={showLabels}
        explode={explode}
        dark={dark}
        morphToken={morphToken}
      />

      <CameraRig fit={fit} resetToken={resetToken} intro={intro} />
      {enableWhoosh && <WhooshRig />}
      <OrbitControls
        ref={controlsRef as never}
        makeDefault
        enablePan={false}
        minDistance={fit * 0.55}
        maxDistance={fit * 6}
        autoRotate={rotate}
        autoRotateSpeed={0.9}
        zoomSpeed={0.9}
      />
    </Canvas>
  )
}

// ---------------------------------------------------------------------------
// Lightweight preview used for gallery card thumbnails (no sky, grid, labels)
// ---------------------------------------------------------------------------

const EMPTY_DIMS: DimensionMap = { sizeParam: 12, unit: 'm', byKey: {}, labels: [] }

// Frame the whole instrument inside the 4:3 card. The thumbnail camera at
// [6.5, 4.5, 8] / fov 40 shows ~8.0 world units vertically, so scale the
// largest single-side extent down to a safe ~3.8 and vertically centre the
// model's own bounding box rather than assuming it sits at the origin.
const THUMB_SCALE = 3.8

function ThumbRig({
  type,
  dims,
  spin,
  dark,
}: {
  type: string
  dims: DimensionMap
  spin: boolean
  dark: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  const prims = useMemo(() => buildYantra3D(type, dims), [type, dims])
  const fit = Math.max(geometryFit(type, dims), 1)
  const scale = THUMB_SCALE / fit
  let yMin = Infinity
  let yMax = -Infinity
  for (const p of prims) {
    const [lo, hi] = yBoundsOf(p)
    yMin = Math.min(yMin, lo)
    yMax = Math.max(yMax, hi)
  }
  const yOff = yMin === Infinity ? 0 : -((yMin + yMax) / 2) * scale
  useFrame((_, dt) => {
    if (spin && ref.current) ref.current.rotation.y += dt * 0.45
  })
  return (
    <group ref={ref} scale={scale} position={[0, yOff, 0]}>
      {prims.map((p, i) => (
        <PrimitiveNode key={i} p={p} dark={dark} hideLabel />
      ))}
    </group>
  )
}

export function YantraThumbCanvas({
  type,
  dims = EMPTY_DIMS,
  spin = true,
  theme = 'dark',
}: {
  type: string
  dims?: DimensionMap
  spin?: boolean
  theme?: 'dark' | 'light'
}) {
  const dark = theme === 'dark'
  return (
    <Canvas
      camera={{ position: [6.5, 4.5, 8], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.0} color="#e2e4e7" />
      <directionalLight
        position={[8, 10, 6]}
        intensity={dark ? 1.4 : 1.6}
        color={dark ? '#f4f5f6' : '#ffd9a0'}
      />
      <directionalLight position={[-7, 4, -6]} intensity={dark ? 0.45 : 0.6} color="#c0c3c9" />
      <ThumbRig type={type} dims={dims} spin={spin} dark={dark} />
    </Canvas>
  )
}