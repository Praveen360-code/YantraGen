// Human-readable labels for instrument size parameters (and render captions).

export const SIZE_PARAM_LABELS: Record<string, string> = {
  gnomon_slant: 'Gnomon slant (hypotenuse)',
  arc_radius: 'Arc radius',
  inner_radius: 'Inner (pillar/wall) radius',
  outer_radius: 'Outer radius',
  disc_radius: 'Disc radius',
  plank_length: 'Plank length',
  ring_radius: 'Ring radius',
  sphere_radius: 'Sphere radius',
  dial_radius: 'Dial radius',
}

export function sizeParamLabel(paramKey: string | undefined): string {
  if (!paramKey) return 'Size (characteristic dimension)'
  return SIZE_PARAM_LABELS[paramKey] ?? 'Size (characteristic dimension)'
}

// Map a size-param key to a short caption used under each instrument card.
export const SIZE_PARAM_SHORT: Record<string, string> = {
  gnomon_slant: 'by gnomon slant',
  arc_radius: 'by arc radius',
  inner_radius: 'by radius',
  outer_radius: 'by radius',
  disc_radius: 'by disc radius',
  plank_length: 'by plank length',
  ring_radius: 'by ring radius',
  sphere_radius: 'by sphere radius',
  dial_radius: 'by dial radius',
}

// SVG view captions for the technical-drawings panel.
export const SVG_VIEW_LABELS: Record<string, string> = {
  elevation: 'Elevation (meridian cross-section)',
  quadrant: 'Quadrant time scale (hour lines)',
  plan: 'Plan (from above)',
  face: 'Dial face (equatorial)',
  tilt: 'Side view (tilt)',
  hour_disk: 'Right-ascension / hour-angle disk',
  zodiac_wheel: 'Zodiac wheel (twelve dials)',
  dial_face: 'Representative dial face',
}

export function svgViewLabel(key: string): string {
  return SVG_VIEW_LABELS[key] ?? `${key} view`
}
