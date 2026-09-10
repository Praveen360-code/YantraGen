import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { sound } from '../lib/sound'

interface SoundContextValue {
  muted: boolean
  setMuted: (m: boolean) => void
  toggleMuted: () => void
}

const SoundContext = createContext<SoundContextValue>({
  muted: false,
  setMuted: () => {},
  toggleMuted: () => {},
})

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState<boolean>(() => sound.isMuted())

  const setMuted = useCallback((m: boolean) => {
    sound.setMuted(m)
    setMutedState(m)
  }, [])

  const toggleMuted = useCallback(() => {
    sound.unlock()
    const next = !sound.isMuted()
    sound.setMuted(next)
    setMutedState(next)
  }, [])

  // Persisted pref follows the engine's localStorage value.
  useEffect(() => {
    setMutedState(sound.isMuted())
  }, [])

  const value = useMemo(
    () => ({ muted, setMuted, toggleMuted }),
    [muted, setMuted, toggleMuted],
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound() {
  return useContext(SoundContext)
}