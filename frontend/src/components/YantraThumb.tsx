import { YantraThumbCanvas } from './three/Yantra3D'

/**
 * Thin wrapper so instrument-card thumbnails can be code-split alongside the
 * rest of the 3D bundle (three.js loads only once the gallery is needed).
 */
export default function YantraThumb({
  type,
  theme,
}: {
  type: string
  theme: 'dark' | 'light'
}) {
  return <YantraThumbCanvas type={type} theme={theme} />
}