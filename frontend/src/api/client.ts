// Thin fetch wrapper around the FastAPI backend.
import type {
  DimensionsForm,
  DimensionsResponse,
  InstrumentDto,
  ReferenceSiteDto,
  ValidationDto,
} from './types'

const BASE = '/api'

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let detail: unknown
    try {
      const body = await res.json()
      detail = body.detail
    } catch {
      detail = res.statusText
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function getInstruments(): Promise<{ instruments: InstrumentDto[] }> {
  return http(`${BASE}/yantra/types`)
}

export function getReferenceSites(): Promise<{ sites: ReferenceSiteDto[] }> {
  return http(`${BASE}/reference-sites`)
}

export function getDimensions(form: DimensionsForm): Promise<DimensionsResponse> {
  const body = {
    lat: form.lat,
    long: form.long,
    size_param: form.sizeParam,
    unit: form.unit,
    reference_meridian: form.referenceMeridian,
  }
  return http(`${BASE}/yantra/${form.yantraType}/dimensions`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function streamChat(
  messages: ChatMessage[],
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })
  if (!res.ok || !res.body) {
    let detail = `Chat failed (${res.status})`
    try {
      const body = await res.json()
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      /* keep default detail */
    }
    throw new Error(detail)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + 1)
      if (!line) continue
      try {
        const parsed = JSON.parse(line)
        if (parsed.delta) onDelta(parsed.delta)
      } catch {
        /* ignore malformed lines */
      }
    }
  }
}

export function validate(
  yantraType: string,
  lat: number,
  lng: number,
): Promise<ValidationDto> {
  return http(`${BASE}/yantra/${yantraType}/validate`, {
    method: 'POST',
    body: JSON.stringify({ lat, long: lng }),
  })
}

export function exportSpec(
  form: DimensionsForm & { yantraType: string },
  format: 'csv' | 'dxf' | 'pdf',
): Promise<Blob> {
  const body = {
    yantra_type: form.yantraType,
    lat: form.lat,
    long: form.long,
    size_param: form.sizeParam,
    unit: form.unit,
    reference_meridian: form.referenceMeridian,
    format,
  }
  return fetch(`${BASE}/yantra/${form.yantraType}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((res) => {
    if (!res.ok) throw new Error(`Export failed: ${res.status}`)
    return res.blob()
  })
}
