// Procedural 3D geometry for each yantra type, built in real metres.
// Dimensions come from the backend-computed spec (DimensionMap) and key
// directly off the machine names emitted by the FastAPI modules.
//
// World convention: +Y up, +X east, +Z north (meridian plane = Y–Z).
//
// Every builder takes an `explode` factor in [0, 1] that pushes structural
// sub-assemblies apart for the exploded-view toggle in the 3D viewer.

import type { DimensionMap } from './dimensions'

export type Primitive =
  | {
      kind: 'box'
      size: [number, number, number]
      pos: [number, number, number]
      rot?: [number, number, number]
      color?: string
      opacity?: number
      transparent?: boolean
      label?: string
      labelPos?: [number, number, number]
    }
  | {
      kind: 'cylinder'
      radius: number
      height: number
      pos: [number, number, number]
      rot?: [number, number, number]
      color?: string
      segments?: number
      thetaStart?: number
      thetaLength?: number
      openEnded?: boolean
      label?: string
      labelPos?: [number, number, number]
    }
  | {
      kind: 'ring'
      radius: number
      tube: number
      pos?: [number, number, number]
      rot?: [number, number, number]
      color?: string
      label?: string
      labelPos?: [number, number, number]
    }
  | {
      kind: 'sphere'
      radius: number
      pos?: [number, number, number]
      color?: string
      opacity?: number
      transparent?: boolean
      label?: string
      labelPos?: [number, number, number]
    }
  | {
      kind: 'disk'
      radius: number
      pos?: [number, number, number]
      rot?: [number, number, number]
      color?: string
      label?: string
      labelPos?: [number, number, number]
    }
  | {
      kind: 'line'
      start: [number, number, number]
      end: [number, number, number]
      color?: string
      width?: number
      label?: string
      labelPos?: [number, number, number]
    }
  | {
      kind: 'triangle'
      a: [number, number, number]
      b: [number, number, number]
      c: [number, number, number]
      thickness: number
      color?: string
      label?: string
      labelPos?: [number, number, number]
    }
  | {
      kind: 'arc'
      radius: number
      tube: number
      start?: number
      sweep?: number
      pos?: [number, number, number]
      rot?: [number, number, number]
      color?: string
      label?: string
      labelPos?: [number, number, number]
    }
  | {
      kind: 'cone'
      radius: number
      height: number
      pos: [number, number, number]
      rot?: [number, number, number]
      segments?: number
      color?: string
      label?: string
      labelPos?: [number, number, number]
    }

// Monochrome material palette (dark mode): graphite/brushed-metal greys
// for the instrument, near-black graphite where dark stone is needed.
// Differentiation comes from value, not hue.
export const C = {
  sandstone: '#c8c9cd',
  sandstoneDark: '#96979d',
  sandstoneLine: '#7f8087',
  terracotta: '#a6a6aa',
  brass: '#d5d6d9',
  brassDark: '#8e8f95',
  gold: '#f2f3f5',
  metal: '#b4b6bb',
  metalDark: '#84868c',
  ink: '#2a2a2f',
  night: '#0e0e11',
}

const R = (d: DimensionMap, key: string, fallback: number) => d.byKey[key] ?? fallback
const deg = (v: number) => (v * Math.PI) / 180

// Small helpers ---------------------------------------------------------
const V3 = (x: number, y: number, z: number): [number, number, number] => [x, y, z]
const push = (
  p: [number, number, number],
  dir: [number, number, number],
  x: number,
  amount: number,
): [number, number, number] => [
  p[0] + dir[0] * x * amount,
  p[1] + dir[1] * x * amount,
  p[2] + dir[2] * x * amount,
]

export function buildYantra3D(type: string, d: DimensionMap, explode = 0): Primitive[] {
  switch (type) {
    case 'samrat':
      return buildSamrat(d, explode)
    case 'dakshinottara_bhitti':
      return buildDakshinottara(d, explode)
    case 'rama':
      return buildRama(d, explode)
    case 'digamsa':
      return buildDigamsa(d, explode)
    case 'nadi_valaya':
      return buildNadiValaya(d, explode)
    case 'chaapa':
      return buildChaapa(d, explode)
    case 'palaka':
      return buildPalaka(d, explode)
    case 'dhruva_protha_chakra':
      return buildDhruvaProtha(d, explode)
    case 'yantra_samrat':
      return buildYantraSamrat(d, explode)
    case 'gola_chakra':
      return buildGolaChakra(d, explode)
    case 'bhitti':
      return buildBhitti(d, explode)
    case 'rasivalaya':
      return buildRasivalaya(d, explode)
    default:
      return []
  }
}

// hour tick helper: a fan of spokes in a given vertical plane (normal = ±Z)
function hourSpokes(
  cx: number,
  cy: number,
  radius: number,
  planeZ: number,
  color: string,
): Primitive[] {
  const spokes: Primitive[] = []
  for (let h = -6; h <= 6; h++) {
    const alpha = deg(90 - 15 * h)
    const tx = cx + radius * Math.cos(alpha)
    const ty = cy + radius * Math.sin(alpha)
    spokes.push({
      kind: 'line',
      start: [cx, cy, planeZ],
      end: [tx, ty, planeZ],
      width: 0.06,
      color,
    })
  }
  return spokes
}

// Samrat Yantra — equinoctial right-triangular gnomon + two hour quadrants
function buildSamrat(d: DimensionMap, x: number): Primitive[] {
  const phi = R(d, 'latitude_angle', 27) // deg; hypotenuse runs parallel to polar axis
  const H = R(d, 'gnomon_slant', R(d, 'size', 12))
  const Hv = R(d, 'gnomon_height', H * Math.sin(deg(phi)))
  const B = R(d, 'base_length', H * Math.cos(deg(phi)))
  const quadR = R(d, 'quadrant_radius', H)
  const unit = d.unit === 'm' ? 'm' : 'ft'

  const wallT = Math.max(0.5, H * 0.045)
  const plinthT = Math.max(0.4, H * 0.03)

  // Gnomon right-triangle (meridian plane). South foot -> north apex.
  const foot = V3(x * 0.15, 0, 0)
  const apex = V3(x * 0.15, Hv, B)
  const baseN = V3(x * 0.15, 0, B)

  const quadPos: [number, number, number] = [
    (wallT + plinthT) * 1.1 + x * quadR * 0.7,
    Hv + quadR * 0.12,
    B - quadR * 0.05,
  ]

  const items: Primitive[] = [
    // ground plinth under the whole apparatus (north-south)
    { kind: 'box', size: [quadR * 2.4, plinthT, B * 1.05], pos: push(V3(0, -plinthT / 2, B / 2), [0, 0, 1], x, B * 0.22), color: C.sandstoneDark },
    // the inclined gnomon slab
    {
      kind: 'triangle',
      a: [foot[0], foot[1], foot[2]],
      b: [apex[0], apex[1], apex[2]],
      c: [baseN[0], baseN[1], baseN[2]],
      thickness: wallT,
      color: C.sandstone,
      label: `slant H = ${H.toFixed(1)} ${unit}`,
      labelPos: [foot[0] + wallT * 1.1, Hv * 0.42, B * 0.42],
    },
    // west + east hour quadrants (brass arcs with hour spokes)
    {
      kind: 'arc',
      radius: quadR,
      tube: Math.max(0.25, quadR * 0.028),
      start: 0,
      sweep: 90,
      pos: quadPos,
      rot: [deg(90), 0, deg(90)],
      color: C.gold,
      label: `quadrant R ${quadR.toFixed(1)} ${unit}`,
      labelPos: push([quadPos[0] + quadR * 0.62, quadPos[1] + quadR * 0.62, quadPos[2]], [0, 0, 1], x, 2),
    },
    ...hourSpokes(quadPos[0], quadPos[1], quadR - 0.4, 0, C.terracotta),
    // base line hint (ground reference)
    { kind: 'line', start: foot, end: V3(foot[0], 0.01, B), width: 0.12, color: C.sandstoneLine },
    // latitude angle marker at the foot
    {
      kind: 'arc',
      radius: Math.min(2.2, H * 0.12),
      tube: 0.08,
      start: 0,
      sweep: phi,
      pos: [foot[0], foot[1], foot[2]],
      rot: [0, 0, 0],
      color: C.gold,
      label: `φ = ${phi.toFixed(1)}°`,
      labelPos: V3(foot[0] + 3.4, 1.6, 0.4),
    },
    // vertical height annotation on the back wall
    {
      kind: 'line',
      start: [apex[0], apex[1], apex[2]],
      end: [baseN[0], baseN[1], baseN[2]],
      width: 0.16,
      color: C.sandstoneDark,
      label: `H·sin φ = ${Hv.toFixed(1)} ${unit}`,
      labelPos: [baseN[0] + wallT * 0.9 + 1.4, Hv * 0.5, baseN[2] + 0.5],
    },
    // base length annotation
    {
      kind: 'line',
      start: foot,
      end: baseN,
      width: 0.14,
      color: C.brass,
      label: `H·cos φ = ${B.toFixed(1)} ${unit}`,
      labelPos: V3(foot[0] + 2, -1.6, B * 0.4),
    },
    // decorative sun sphere high in the east
    { kind: 'sphere', radius: Math.max(0.5, H * 0.045), pos: push(V3(quadPos[0] + quadR * 1.1, quadR * 1.5, 0), [0, 0, 1], x, 2), color: C.gold },
  ]
  return items
}

// Dakshinottara Bhitti — vertical north-south wall with a semicircular arc
function buildDakshinottara(d: DimensionMap, x: number): Primitive[] {
  const Rarc = R(d, 'arc_radius', 12)
  const zenith = R(d, 'zenith_span', 90)
  const unit = d.unit === 'm' ? 'm' : 'ft'
  return [
    { kind: 'box', size: [Rarc * 0.6, Rarc * 2, 0.6], pos: push(V3(0, Rarc, 0), [0, 0, 1], x, Rarc * 0.5), color: C.sandstone, label: `wall height ${(Rarc * 2).toFixed(1)} ${unit}`, labelPos: V3(-Rarc * 0.6, Rarc * 2 + 1.4, 0.4) },
    {
      kind: 'arc',
      radius: Rarc * 0.85,
      tube: Rarc * 0.03,
      start: 0,
      sweep: Math.min(zenith, 180),
      pos: push(V3(0, Rarc, Rarc * 0.45), [0, 0, 1], x, 1),
      rot: [0, Math.PI / 2, 0],
      color: C.gold,
      label: `arc R ${(Rarc * 0.85).toFixed(1)} ${unit}`,
      labelPos: V3(0, Rarc * 1.7, Rarc * 0.5),
    },
    { kind: 'box', size: [Rarc * 0.1, Rarc, 0.8], pos: [0, Rarc / 2, 0], color: C.sandstoneDark },
  ]
}

// Rama Yantra — a pair of open cylindrical walls around a central pillar,
// with a graduated floor scale (zenith circles + azimuth radials).
function buildRama(d: DimensionMap, x: number): Primitive[] {
  const Rc = R(d, 'inner_radius', 12)
  const unit = d.unit === 'm' ? 'm' : 'ft'
  const wallH = Rc
  const segs = 48
  const thick = Math.max(0.45, Rc * 0.035)
  const wallPad = x * Rc * 0.2
  const pillarLift = x * Rc * 0.28
  const items: Primitive[] = []

  // Wall shells: two semicircular walls with entry gaps at E and W (theta is
  // measured from +Z north toward +X east, so [105..255] wraps the south).
  for (const [ts, tl] of [
    [-75, 150],
    [105, 150],
  ] as const) {
    items.push({
      kind: 'cylinder',
      radius: Rc + thick + wallPad,
      height: wallH,
      pos: [0, wallH / 2, 0],
      thetaStart: ts,
      thetaLength: tl,
      openEnded: true,
      segments: segs,
      color: C.sandstone,
      label: `wall H ${Rc.toFixed(1)} ${unit}`,
      labelPos: V3(0, Rc + 1.8, Rc + 0.8),
    })
    items.push({
      kind: 'cylinder',
      radius: Rc + wallPad,
      height: wallH,
      pos: [0, wallH / 2, 0],
      thetaStart: ts,
      thetaLength: tl,
      openEnded: true,
      segments: segs,
      color: C.sandstoneDark,
    })
  }

  // Central pillar (equal height to the walls, per Kaye).
  items.push({
    kind: 'cylinder',
    radius: Rc * 0.06,
    height: Rc,
    pos: [0, Rc / 2 + pillarLift, 0],
    color: C.sandstoneDark,
    segments: 24,
    label: `pillar H ${Rc.toFixed(1)} ${unit}`,
    labelPos: V3(Rc * 0.5, Rc * 0.5 + pillarLift, 0),
  })

  // Floor plate + rim.
  items.push({ kind: 'disk', radius: Rc, pos: [0, 0.06, 0], color: C.sandstoneDark })
  items.push({ kind: 'ring', radius: Rc, tube: Rc * 0.022, pos: [0, 0.16, 0], color: C.brass })

  // Zenith-distance floor circles z = 15°, 30°, 45°.
  items.push({ kind: 'ring', radius: Rc * Math.tan(deg(15)), tube: Rc * 0.014, pos: [0, 0.16, 0], color: C.gold })
  items.push({ kind: 'ring', radius: Rc * Math.tan(deg(30)), tube: Rc * 0.014, pos: [0, 0.16, 0], color: C.gold })
  items.push({ kind: 'ring', radius: Rc * Math.tan(deg(45)) - Rc * 0.01, tube: Rc * 0.014, pos: [0, 0.16, 0], color: C.gold })

  // Azimuth radial lines on the floor (every 15°).
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    items.push({
      kind: 'line',
      start: [Math.cos(a) * Rc * 0.13, 0.2, Math.sin(a) * Rc * 0.13],
      end: [Math.cos(a) * Rc * 0.98, 0.2, Math.sin(a) * Rc * 0.98],
      width: 0.16,
      color: C.terracotta,
    })
  }

  return items
}

// Digamsa — central pillar + concentric azimuth ground scales
function buildDigamsa(d: DimensionMap, x: number): Primitive[] {
  const Ro = R(d, 'outer_radius', 12)
  const ph = R(d, 'pillar_height', Ro)
  const unit = d.unit === 'm' ? 'm' : 'ft'
  const ticks: Primitive[] = []
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    ticks.push({
      kind: 'line',
      start: [Math.cos(a) * Ro * 0.18, 0.2, Math.sin(a) * Ro * 0.18],
      end: [Math.cos(a) * Ro * 0.28, 0.2, Math.sin(a) * Ro * 0.28],
      width: 0.1,
      color: C.terracotta,
    })
  }
  return [
    { kind: 'cylinder', radius: Ro * 0.07, height: ph, pos: [0, ph / 2, 0], color: C.sandstone, segments: 24, label: `pillar H ${ph.toFixed(1)} ${unit}`, labelPos: V3(Ro * 0.4, ph * 0.55, 0) },
    { kind: 'disk', radius: Ro, pos: [0, 0.06, 0], color: C.sandstoneDark },
    { kind: 'ring', radius: Ro, tube: Ro * 0.025, pos: [0, 0.16, 0], color: C.brass, label: `outer R ${Ro.toFixed(1)} ${unit}`, labelPos: push(V3(Ro, 0.5, 0), [0, 0, 1], x, 1) },
    { kind: 'ring', radius: Ro * 0.7, tube: Ro * 0.02, pos: [0, 0.16, 0], color: C.gold },
    { kind: 'ring', radius: Ro * 0.4, tube: Ro * 0.02, pos: [0, 0.16, 0], color: C.gold },
    ...ticks,
  ]
}

// Nadi Valaya — two tilted equatorial dial faces + pole-pointing gnomon
function buildNadiValaya(d: DimensionMap, x: number): Primitive[] {
  const discR = R(d, 'disc_radius', 12)
  const phi = R(d, 'disc_tilt', R(d, 'disc_tilt', 27))
  const tilt = deg(90 - phi) // colatitude; normal points at the celestial pole
  const unit = d.unit === 'm' ? 'm' : 'ft'
  const faceRot: [number, number, number] = [tilt, 0, 0]

  return [
    { kind: 'cylinder', radius: discR, height: 0.5, pos: [0, 0.25, 0], rot: faceRot, color: C.sandstone, segments: 48, label: `disc R ${discR.toFixed(1)} ${unit}`, labelPos: [discR * 0.55, discR * 0.35, discR * 0.3] },
    { kind: 'ring', radius: discR * 0.8, tube: 0.18, pos: [0, 0.25, 0], rot: faceRot, color: C.gold },
    { kind: 'ring', radius: discR * 0.5, tube: 0.14, pos: [0, 0.25, 0], rot: faceRot, color: C.brass },
    { kind: 'cylinder', radius: discR, height: 0.5, pos: push([0, 1.1, 0], [0, 1, 0], x, 1.2), rot: faceRot, color: C.sandstoneDark, segments: 48, label: `tilt ${Math.round(phi)}° from vertical`, labelPos: push([-discR, 1.1, discR], [0, 1, 0], x, 1.2) },
    { kind: 'ring', radius: discR * 0.8, tube: 0.18, pos: push([0, 1.1, 0], [0, 1, 0], x, 1.2), rot: faceRot, color: C.gold },
    // pole-pointing gnomon rod
    {
      kind: 'cylinder',
      radius: discR * 0.025,
      height: discR * 1.4,
      pos: push([0, 1.1 + discR * 0.35, 0], [0, 1, 0], x, 1.2),
      rot: faceRot,
      color: C.metal,
      label: `gnomon ${discR.toFixed(1)} ${unit}`,
      labelPos: push([discR * 0.35, 2.2, discR * 0.2], [0, 1, 0], x, 1.2),
    },
  ]
}

// Chaapa — graduated semicircular bow on a horizontal chord
function buildChaapa(d: DimensionMap, x: number): Primitive[] {
  const arcR = R(d, 'arc_radius', 12)
  const chord = R(d, 'chord_length', arcR * 2)
  const unit = d.unit === 'm' ? 'm' : 'ft'
  return [
    {
      kind: 'arc',
      radius: arcR,
      tube: arcR * 0.035,
      start: 0,
      sweep: 180,
      pos: push(V3(0, arcR, 0), [0, 1, 0], x, arcR * 0.3),
      rot: [0, 0, deg(90)],
      color: C.gold,
      label: `arc R ${arcR.toFixed(1)} ${unit}`,
      labelPos: push(V3(0, arcR * 2 + 1, 1.2), [0, 1, 0], x, arcR * 0.3),
    },
    { kind: 'box', size: [chord, 0.5, 0.5], pos: [0, -0.25, 0], color: C.sandstone, label: `chord ${chord.toFixed(1)} ${unit}` },
    { kind: 'box', size: [0.5, arcR, 0.5], pos: [0, arcR / 2, 0], color: C.sandstoneDark },
    { kind: 'cone', radius: 1.2, height: 2.4, pos: [0, -1.4, 0], color: C.sandstoneDark },
  ]
}

// Palaka — level plank with a vertical gnomon and noon shadow marks
function buildPalaka(d: DimensionMap, x: number): Primitive[] {
  const plank = R(d, 'plank_length', 12)
  const gnomon = R(d, 'gnomon_height', 6)
  const sh = (k: string, f: number) => R(d, k, f)
  const shadows: Primitive[] = [
    { kind: 'line', start: [0, 0.5, 0], end: [sh('noon_shadow_equinox', plank * 0.55), 0.5, 0], width: 0.08, color: C.sandstoneLine },
    { kind: 'line', start: [0, 0.5, 0], end: [sh('noon_shadow_winter', plank * 0.85), 0.5, 0], width: 0.08, color: C.gold },
    { kind: 'line', start: [0, 0.5, 0], end: [sh('noon_shadow_summer', plank * 0.3), 0.5, 0], width: 0.08, color: C.terracotta },
  ]
  return [
    { kind: 'box', size: [plank, 0.5, plank * 0.4], pos: [0, -0.25, 0], color: C.sandstone, label: `plank L ${plank.toFixed(1)} ${d.unit === 'm' ? 'm' : 'ft'}`, labelPos: V3(0, -0.8, plank * 0.35) },
    { kind: 'box', size: [0.5, gnomon, 0.5], pos: push([0, gnomon / 2, 0], [0, 1, 0], x, gnomon * 0.3), color: C.ink, label: `gnomon H ${gnomon.toFixed(1)} ${d.unit === 'm' ? 'm' : 'ft'}` },
    ...shadows,
  ]
}

// Dhruva-Protha-Chakra — graduated ring on a polar axis + sighting needle
function buildDhruvaProtha(d: DimensionMap, x: number): Primitive[] {
  const ringR = R(d, 'ring_radius', 12)
  const phi = R(d, 'polar_axis_inclination', 27)
  const tilt = deg(90 - phi)
  const needle = R(d, 'sighting_needle_length', ringR * 2)
  const unit = d.unit === 'm' ? 'm' : 'ft'
  const axisRot: [number, number, number] = [tilt, 0, 0]
  return [
    { kind: 'cylinder', radius: ringR * 0.03, height: ringR * 1.6, pos: [0, ringR * 0.8, 0], rot: axisRot, color: C.metal, segments: 12, label: `axis ∥ polar`, labelPos: [ringR * 0.35, ringR * 1.4, ringR * 0.3] },
    { kind: 'ring', radius: ringR, tube: ringR * 0.045, pos: push([0, ringR * 1.6, 0], [0, 1, 0], x, 1.8), rot: axisRot, color: C.gold, label: `ring R ${ringR.toFixed(1)} ${unit}`, labelPos: push([ringR * 0.9, ringR * 1.6, ringR * 0.9], [0, 1, 0], x, 1.8) },
    { kind: 'box', size: [0.35, 0.35, needle], pos: [0, ringR * 1.6, 0], color: C.ink, label: `needle ${needle.toFixed(1)} ${unit}` },
    { kind: 'box', size: [ringR * 0.2, ringR * 0.15, ringR * 0.2], pos: [0, ringR * 1.6, 0], color: C.brass },
  ]
}

// Yantra-Samrat — fused samrat gnomon + coaxial dhruva ring
function buildYantraSamrat(d: DimensionMap, x: number): Primitive[] {
  const phi = R(d, 'polar_axis_inclination', 27)
  const H = R(d, 'gnomon_slant', 18)
  const Hv = R(d, 'vertical_gnomon_height', H * Math.sin(deg(phi)))
  const B = R(d, 'base_length', H * Math.cos(deg(phi)))
  const ringR = R(d, 'declination_ring_radius', B * 0.6)
  const unit = d.unit === 'm' ? 'm' : 'ft'
  const wallT = Math.max(0.5, H * 0.045)
  const tilt = deg(90 - phi)

  const foot = [x * 0.2, 0, 0] as [number, number, number]
  const apex = [x * 0.2, Hv, B] as [number, number, number]
  const baseN = [x * 0.2, 0, B] as [number, number, number]

  return [
    { kind: 'box', size: [ringR * 2, 0.4, B * 1.05], pos: [0, -0.2, B / 2], color: C.sandstoneDark },
    {
      kind: 'triangle',
      a: foot,
      b: apex,
      c: baseN,
      thickness: wallT,
      color: C.sandstone,
      label: `slant H = ${H.toFixed(1)} ${unit}`,
      labelPos: [foot[0] + wallT * 1.1, Hv * 0.45, B * 0.45],
    },
    { kind: 'line', start: foot, end: baseN, width: 0.12, color: C.brass, label: `H·cos φ = ${B.toFixed(1)} ${unit}`, labelPos: V3(foot[0] + 2, -1.8, B * 0.4) },
    {
      kind: 'ring',
      radius: ringR,
      tube: ringR * 0.05,
      pos: [0, Hv + ringR * 0.5, B - ringR * 0.35],
      rot: [tilt, 0, 0],
      color: C.gold,
      label: `Dhruva ring R ${ringR.toFixed(1)} ${unit}`,
      labelPos: [ringR * 1.1, Hv + ringR * 0.9 + 1.2, B - ringR * 0.35],
    },
  ]
}

// Gola / Chakra — armillary sphere (meridian, horizon, equator, ecliptic)
function buildGolaChakra(d: DimensionMap, x: number): Primitive[] {
  const Rr = R(d, 'sphere_radius', 12)
  const phi = R(d, 'polar_axis_altitude', 27)
  const ecl = R(d, 'ecliptic_obliquity', 23.44)
  const unit = d.unit === 'm' ? 'm' : 'ft'
  const colat = deg(90 - phi)
  const s = 1 + x * 0.28

  // meridian ring: vertical, plane = N-S (Y-Z) -> rotate ring (X-Y plane) about Y by 90°
  const meridian = [deg(90), 0, deg(90)] as [number, number, number]
  // horizon ring: horizontal (X-Z plane)
  const horizon = [deg(90), 0, 0] as [number, number, number]
  // equatorial ring: plane perpendicular to polar axis
  const equator = [colat, 0, 0] as [number, number, number]
  // ecliptic ring: equator + obliquity about local X
  const ecliptic = [colat - deg(ecl), 0, 0] as [number, number, number]

  return [
    { kind: 'sphere', radius: Rr * 0.32, pos: push([0, Rr, 0], [0, 1, 0], x, Rr * 0.4), color: C.sandstoneDark, opacity: 0.5, transparent: true, label: `armillary R ${Rr.toFixed(1)} ${unit}`, labelPos: push([Rr * 1.2, Rr * 2.1, 0], [0, 1, 0], x, Rr * 0.4) },
    { kind: 'ring', radius: Rr * s, tube: Rr * 0.035, pos: push([0, Rr, 0], [0, 1, 0], x, Rr * 0.4), rot: meridian, color: C.sandstone },
    { kind: 'ring', radius: Rr * s, tube: Rr * 0.035, pos: push([0, Rr, 0], [0, 1, 0], x, Rr * 0.4), rot: horizon, color: C.brassDark },
    { kind: 'ring', radius: Rr * s, tube: Rr * 0.05, pos: push([0, Rr, 0], [0, 1, 0], x, Rr * 0.4), rot: equator, color: C.gold, label: `equator tilt ${90 - Math.round(phi)}°`, labelPos: push([Rr * 1.1, Rr * 0.4, Rr * 0.9], [0, 1, 0], x, Rr * 0.4) },
    { kind: 'ring', radius: Rr * s, tube: Rr * 0.04, pos: push([0, Rr, 0], [0, 1, 0], x, Rr * 0.4), rot: ecliptic, color: C.terracotta, label: `ecliptic +${ecl.toFixed(1)}°` },
  ]
}

// Bhitti — mural quadrant set in a wall
function buildBhitti(d: DimensionMap, x: number): Primitive[] {
  const Rarc = R(d, 'arc_radius', 12)
  const unit = d.unit === 'm' ? 'm' : 'ft'
  return [
    { kind: 'box', size: [Rarc, Rarc * 2, 0.6], pos: push([0, Rarc, 0], [0, 0, 1], x, Rarc * 0.4), color: C.sandstone, label: `wall H ${(Rarc * 2).toFixed(1)} ${unit}` },
    { kind: 'box', size: [0.8, Rarc * 2, 3.4], pos: [-Rarc, Rarc, 1.4], color: C.sandstoneDark },
    {
      kind: 'arc',
      radius: Rarc * 0.9,
      tube: Rarc * 0.04,
      start: 0,
      sweep: 90,
      pos: push([-Rarc * 0.1, Rarc, 0.4], [0, 0, 1], x, 1.4),
      rot: [0, Math.PI / 2, deg(90)],
      color: C.gold,
      label: `quadrant R ${Rarc.toFixed(1)} ${unit}`,
      labelPos: push([-Rarc * 0.35, Rarc * 1.5, 0.5], [0, 0, 1], x, 1.4),
    },
  ]
}

// Rasivalaya — twelve zodiac dials around a wheel
function buildRasivalaya(d: DimensionMap, x: number): Primitive[] {
  const dialR = R(d, 'dial_radius', 12)
  const phi = R(d, 'ecliptic_obliquity', 23.44) * 0 + 26.9
  const colat = deg(90 - phi)
  const unit = d.unit === 'm' ? 'm' : 'ft'
  const tilt: [number, number, number] = [colat, 0, 0]
  const items: Primitive[] = [
    { kind: 'cylinder', radius: dialR, height: 0.6, pos: [0, 0.3, 0], rot: tilt, color: C.sandstone, segments: 48, label: `dial R ${dialR.toFixed(1)} ${unit}`, labelPos: [dialR * 0.6, Math.sin(colat) * dialR * 0.8, dialR * 0.4] },
    { kind: 'ring', radius: dialR * 0.8, tube: 0.2, pos: [0, 0.3, 0], rot: tilt, color: C.brass },
    { kind: 'cylinder', radius: dialR * 0.06, height: dialR * 0.8, pos: [0, dialR * 0.4, 0], rot: tilt, color: C.sandstoneDark },
  ]
  const ringR = dialR * 0.22
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const px = Math.cos(a) * dialR * 0.62
    const pz = Math.sin(a) * dialR * 0.62
    items.push({
      kind: 'cylinder',
      radius: ringR,
      height: 0.55,
      pos: push([px, 0.85, pz], [px / dialR, 0, pz / dialR], x, dialR * 0.5),
      rot: tilt,
      color: i % 2 === 0 ? C.gold : C.sandstoneDark,
      segments: 20,
    })
  }
  return items
}