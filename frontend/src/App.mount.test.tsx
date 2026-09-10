import { describe, it, expect, beforeAll, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { SoundProvider } from './lib/SoundContext'

// The heavy 3D renders are WebGL-only; stub them so the mount smoke test runs
// in jsdom without a real canvas context.
vi.mock('./components/three/Yantra3D', () => ({
  default: () => null,
  YantraThumbCanvas: () => null,
}))

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({
      matches: q.includes('min-width'),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  })

  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO
  ;(globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = (
    cb: FrameRequestCallback,
  ) => setTimeout(() => cb(performance.now()), 16)
  ;(globalThis as unknown as { cancelAnimationFrame: unknown }).cancelAnimationFrame = clearTimeout

  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    writable: true,
    value: () => {},
  })

  // NavSky draws a canvas backdrop in the navbar; stub a no-op 2D context so
  // the smoke test stays quiet in jsdom.
  Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value: () =>
      new Proxy(
        {},
        {
          get: (_t, prop) => {
            if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
              return () => ({ addColorStop: () => {} })
            }
            return () => {}
          },
          set: () => true,
        },
      ),
  })

  const fakeInstrument = (type: string, name: string) => ({
    type,
    name,
    description: `The ${name} yantra`,
    status: 'available',
    howWorks: 'works',
    history: 'history',
    image: 'samrat.webp',
    gallery: [],
  })

  globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = String(url)
    const json = async () => {
      if (u.includes('/api/yantra/types')) {
        return {
          instruments: [
            fakeInstrument('samrat', 'Samrat Yantra'),
            fakeInstrument('rama', 'Rama Yantra'),
          ],
        }
      }
      if (u.includes('/api/reference-sites')) return { sites: [] }
      if (u.includes('/api/yantra/') && u.includes('/dimensions')) {
        return {
          yantra_type: 'samrat',
          size_param: { key: 'h', value: 22.6, unit: 'm' },
          values: [
            { key: 'h', label: 'Gnomon height', value: 22.6, unit: 'm' },
            { key: 'b', label: 'Quadrant radius', value: 15.1, unit: 'm' },
          ],
        }
      }
      return {}
    }
    return { ok: true, status: 200, json } as Response
  })

  ;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = false
})

describe('App renders', () => {
  it('mounts the home page without crashing after async data arrives', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    root.render(
      <QueryClientProvider client={qc}>
        <SoundProvider>
          <App />
        </SoundProvider>
      </QueryClientProvider>,
    )
    await new Promise((r) => setTimeout(r, 300))

    expect(document.body.textContent).toContain('geometry of the sky')
    expect(document.body.textContent).toContain('Samrat Yantra')
  }, 20000)
})