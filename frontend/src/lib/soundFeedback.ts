import { useEffect } from 'react'
import { sound } from '../lib/sound'

const INTERACTIVE = 'button, a, select, input[type="submit"], input[type="button"], [role="button"]'

/**
 * Global event-delegated sound feedback.
 *
 * - `pointerdown` on any interactive element -> brass click pop
 *
 * Event delegation means buttons, nav links, yantra cards (article with
 * onClick) and Leaflet map pins are all covered without touching each
 * component. Cues are silent while the engine is muted.
 */
export function useGlobalSoundFeedback() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.closest(INTERACTIVE) || t.closest('[data-sound-click]')) {
        sound.click()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])
}

/** Unlock audio on the first user gesture anywhere (browsers require it). */
export function useAudioUnlock() {
  useEffect(() => {
    const unlock = () => sound.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
}