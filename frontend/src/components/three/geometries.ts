// Procedural 3D geometry for each yantra type, built in real metres.
// Dimensions come from the backend-computed spec (DimensionMap).
import type { DimensionMap } from './dimensions'

export type Primitive =
  | { kind: 'box'; size: [number, number, number]; pos: [number, number, number]; rot?: [number, number, number]; color?: string; label?: string }
  | { kind: 'cylinder'; radius: number; height: number; pos: [number, number, number]; rot?: [number, number, number]; color?: string; segments?: number; label?: string }
  | { kind: 'ring'; radius: number; tube: number; pos?: [number, number, number]; rot?: [number, number, number]; color?: string; label?: string }
  | { kind: 'sphere'; radius: number; pos?: [number, number, number]; rot?: [number, number, number]; color?: string; label?: string }
  | { kind: 'disk'; radius: number; pos?: [number, number, number]; rot?: [number, number, number]; color?: string; label?: string }
  | { kind: 'line'; start: [number, number, number]; end: [number, number, number]; rot?: [number, number, number]; color?: string; width?: number; label?: string }

// Shared colors
const STONE = '#cbbfae'
const STONE_DARK = '#a89c8b'
const BRASS = '#c8a24a'
const BRASS_DARK = '#a6822f'
const METAL = '#b9b9b9'
const DARK = '#444444'

const R = (d: DimensionMap, key: string, fallback: number) => d.byKey[key] ?? fallback

export function buildYantra3D(type: string, d: DimensionMap): Primitive[] {
  switch (type) {
    case 'samrat':
      return buildSamrat(d)
    case 'dakshinottara_bhitti':
      return buildDakshinottara(d)
    case 'rama':
      return buildRama(d)
    case 'digamsa':
      return buildDigamsa(d)
    case 'nadi_valaya':
      return buildNadiValaya(d)
    case 'chaapa':
      return buildChaapa(d)
    case 'palaka':
      return buildPalaka(d)
    case 'dhruva_protha_chakra':
      return buildDhruvaProtha(d)
    case 'yantra_samrat':
      return buildYantraSamrat(d)
    case 'gola_chakra':
      return buildGolaChakra(d)
    case 'bhitti':
      return buildBhitti(d)
    case 'rasivalaya':
      return buildRasivalaya(d)
    default:
      return []
  }
}

// Samrat Yantra — equinoctial right-triangular gnomon + two quadrant arcs
function buildSamrat(d: DimensionMap): Primitive[] {
  const vHeight = R(d, 'vertical_gnomon_height', 10)
  const base = R(d, 'base_length', 18)
  const quadrantR = R(d, 'quadrant_radius', 12)
  return [
    { kind: 'box', size: [base * 0.04, vHeight, 4], pos: [0, vHeight / 2, 0], color: STONE, label: `height ${vHeight.toFixed(1)} m` },
    { kind: 'box', size: [base, base * 0.04, 4], pos: [base / 2, 0, 0], rot: [0, 0, -0.47], color: STONE_DARK },
    { kind: 'box', size: [base, 0.4, 4.6], pos: [base / 2, -0.2, 0], color: STONE },
    { kind: 'ring', radius: quadrantR, tube: Math.max(0.3, quadrantR * 0.03), pos: [0, vHeight, 0], color: BRASS, label: `quadrant R ${quadrantR.toFixed(1)} m` },
  ]
}

// Dakshinottara Bhitti — vertical north-south wall with a semicircular arc
function buildDakshinottara(d: DimensionMap): Primitive[] {
  const Rarc = R(d, 'arc_radius', 12)
  return [
    { kind: 'box', size: [Rarc * 0.5, Rarc * 2, 0.8], pos: [0, Rarc, 0], color: STONE, label: `wall height ${(Rarc * 2).toFixed(1)} m` },
    { kind: 'ring', radius: Rarc * 0.7, tube: Rarc * 0.04, pos: [0, Rarc * 1.2, 0.9], rot: [Math.PI / 2, 0, 0], color: BRASS, label: `arc R ${(Rarc * 0.7).toFixed(1)} m` },
  ]
}

// Rama Yantra — cylindrical walls around a central pillar, floor scales
function buildRama(d: DimensionMap): Primitive[] {
  const innerR = R(d, 'inner_radius', 12) ?? R(d, 'cylinder_inner_radius', 12)
  return [
    { kind: 'cylinder', radius: innerR, height: innerR, pos: [0, innerR / 2, 0], color: STONE, segments: 48, label: `wall inner R ${innerR.toFixed(1)} m` },
    { kind: 'cylinder', radius: innerR * 0.05, height: innerR, pos: [0, innerR / 2, 0], color: STONE_DARK, segments: 24, label: `pillar H ${innerR.toFixed(1)} m` },
    { kind: 'disk', radius: innerR, pos: [0, 0.05, 0], color: STONE_DARK, label: `floor R ${innerR.toFixed(1)} m` },
  ]
}

// Digamsa — central pillar + concentric ground scales
function buildDigamsa(d: DimensionMap): Primitive[] {
  const outerR = R(d, 'outer_radius', 12) ?? R(d, 'outer_azimuth_circle_radius', 12)
  return [
    { kind: 'cylinder', radius: outerR * 0.06, height: outerR, pos: [0, outerR / 2, 0], color: STONE, segments: 24, label: `pillar H ${outerR.toFixed(1)} m` },
    { kind: 'disk', radius: outerR, pos: [0, 0.05, 0], color: STONE_DARK, label: `outer R ${outerR.toFixed(1)} m` },
    { kind: 'disk', radius: outerR * 0.7, pos: [0, 0.12, 0], color: STONE },
    { kind: 'ring', radius: outerR, tube: outerR * 0.015, pos: [0, 0.4, 0], color: BRASS },
    { kind: 'ring', radius: outerR * 0.7, tube: outerR * 0.015, pos: [0, 0.4, 0], color: BRASS },
  ]
}

// Nadi Valaya — two tilted equatorial dial faces + pole-pointing gnomon
function buildNadiValaya(d: DimensionMap): Primitive[] {
  const discR = R(d, 'disc_radius', 12)
  const gnomon = R(d, 'gnomon_length', 12)
  const tilt: [number, number, number] = [0, 0, -0.47]
  return [
    { kind: 'cylinder', radius: discR, height: discR * 0.02, pos: [0, 0, 0], rot: tilt, color: STONE, segments: 48, label: `disc R ${discR.toFixed(1)} m` },
    { kind: 'cylinder', radius: discR, height: discR * 0.02, pos: [0, discR * 0.03, 0], rot: tilt, color: STONE_DARK, segments: 48 },
    { kind: 'cylinder', radius: discR * 0.02, height: gnomon, pos: [0, gnomon / 2, 0], color: METAL, segments: 12, label: `gnomon ${gnomon.toFixed(1)} m` },
  ]
}

// Chaapa — graduated semicircular bow on a horizontal chord
function buildChaapa(d: DimensionMap): Primitive[] {
  const arcR = R(d, 'arc_radius', 12)
  const chord = R(d, 'chord_length', arcR * 2)
  return [
    { kind: 'ring', radius: arcR, tube: arcR * 0.04, pos: [0, arcR, 0], color: BRASS, label: `arc R ${arcR.toFixed(1)} m` },
    { kind: 'box', size: [chord, 0.5, 0.5], pos: [0, 0, 0], color: STONE, label: `chord ${chord.toFixed(1)} m` },
    { kind: 'box', size: [0.5, arcR, 0.5], pos: [0, arcR / 2, 0], color: STONE_DARK },
  ]
}

// Palaka — level plank with a vertical gnomon
function buildPalaka(d: DimensionMap): Primitive[] {
  const plank = R(d, 'plank_length', 12)
  const gnomon = R(d, 'gnomon_height', 12)
  return [
    { kind: 'box', size: [plank, 0.5, plank * 0.4], pos: [0, -0.25, 0], color: STONE, label: `plank L ${plank.toFixed(1)} m` },
    { kind: 'box', size: [0.5, gnomon, 0.5], pos: [0, gnomon / 2, 0], color: DARK, label: `gnomon H ${gnomon.toFixed(1)} m` },
  ]
}

// Dhruva-Protha-Chakra — graduated ring on a polar axis + sighting needle
function buildDhruvaProtha(d: DimensionMap): Primitive[] {
  const ringR = R(d, 'ring_radius', 12)
  const needle = R(d, 'sighting_needle_length', ringR * 2)
  return [
    { kind: 'cylinder', radius: ringR * 0.03, height: ringR * 1.5, pos: [0, ringR * 0.75, 0], color: METAL, segments: 12, label: `axis H ${(ringR * 1.5).toFixed(1)} m` },
    { kind: 'ring', radius: ringR, tube: ringR * 0.04, pos: [0, ringR * 1.5, 0], rot: [Math.PI / 2, 0, 0], color: BRASS, label: `ring R ${ringR.toFixed(1)} m` },
    { kind: 'box', size: [needle, 0.3, 0.3], pos: [0, ringR * 1.5, 0], color: DARK, label: `needle ${needle.toFixed(1)} m` },
  ]
}

// Yantra-Samrat — fused samrat gnomon + coaxial dhruva ring
function buildYantraSamrat(d: DimensionMap): Primitive[] {
  const vHeight = R(d, 'vertical_gnomon_height', 10)
  const base = R(d, 'base_length', 18)
  const ringR = R(d, 'declination_ring_radius', 8)
  return [
    { kind: 'box', size: [base * 0.04, vHeight, 4], pos: [0, vHeight / 2, 0], color: STONE, label: `height ${vHeight.toFixed(1)} m` },
    { kind: 'box', size: [base, base * 0.04, 4], pos: [base / 2, 0, 0], rot: [0, 0, -0.47], color: STONE_DARK },
    { kind: 'box', size: [base, 0.4, 4.6], pos: [base / 2, -0.2, 0], color: STONE },
    { kind: 'ring', radius: ringR, tube: ringR * 0.05, pos: [base * 0.3, ringR * 1.2, 0], rot: [Math.PI / 2, 0, 0], color: BRASS, label: `Dhruva ring R ${ringR.toFixed(1)} m` },
  ]
}

// Gola / Chakra — armillary sphere (meridian, horizon, equator, ecliptic rings)
function buildGolaChakra(d: DimensionMap): Primitive[] {
  const sphereR = R(d, 'sphere_radius', 12)
  const tilt: [number, number, number] = [0, 0, -0.47]
  return [
    { kind: 'sphere', radius: sphereR * 0.5, color: STONE_DARK, label: `sphere R ${sphereR.toFixed(1)} m` },
    { kind: 'ring', radius: sphereR, tube: sphereR * 0.03, pos: [0, 0, 0], color: BRASS },
    { kind: 'ring', radius: sphereR, tube: sphereR * 0.03, pos: [0, 0, 0], rot: [Math.PI / 2, 0, 0], color: METAL },
    { kind: 'ring', radius: sphereR, tube: sphereR * 0.04, pos: [0, 0, 0], rot: tilt, color: STONE_DARK },
    { kind: 'ring', radius: sphereR, tube: sphereR * 0.03, pos: [0, 0, 0], rot: [Math.PI / 2, 0, 0.42], color: BRASS_DARK },
  ]
}

// Bhitti — mural quadrant set in a wall
function buildBhitti(d: DimensionMap): Primitive[] {
  const Rarc = R(d, 'arc_radius', 12)
  return [
    { kind: 'box', size: [Rarc, Rarc * 2, 0.8], pos: [0, Rarc, 0], color: STONE, label: `wall H ${(Rarc * 2).toFixed(1)} m` },
    { kind: 'box', size: [0.8, Rarc * 2, 4], pos: [-Rarc, Rarc, 2], color: STONE_DARK },
    { kind: 'ring', radius: Rarc* 0.9, tube: Rarc * 0.04, pos: [-0.5 * Rarc, Rarc * 0.9, 0.9], rot: [Math.PI / 2, 0, Math.PI / 4], color: BRASS, label: `arc R ${(Rarc * 0.9).toFixed(1)} m` },
  ]
}

// Rasivalaya — twelve zodiac dials around a wheel
function buildRasivalaya(d: DimensionMap): Primitive[] {
  const dialR = R(d, 'dial_radius', 12)
  const tilt: [number, number, number] = [0, 0, -0.47]
  const items: Primitive[] = [
    { kind: 'cylinder', radius: dialR, height: 0.5, pos: [0, 0, 0], rot: tilt, color: STONE, segments: 48, label: `dial R ${dialR.toFixed(1)} m` },
  ]
  const ringR = dialR * 0.25
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const x = Math.cos(a) * dialR * 0.7
    const z = Math.sin(a) * dialR * 0.7
    items.push({
      kind: 'cylinder',
      radius: ringR * 0.5,
      height: 0.6,
      pos: [x, 0.6, z],
      rot: tilt,
      color: i % 2 === 0 ? BRASS : STONE_DARK,
      segments: 24,
    })
  }
  return items
}
