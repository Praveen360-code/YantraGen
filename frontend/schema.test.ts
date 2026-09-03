import { describe, it, expect } from 'vitest'
import { dimensionsSchema } from './src/lib/schema'

describe('dimensionsSchema', () => {
  it('accepts a valid India coordinate and size', () => {
    const parsed = dimensionsSchema.parse({
      yantraType: 'samrat',
      lat: 26.9239,
      long: 75.8267,
      sizeParam: 22.6,
      unit: 'm',
      referenceMeridian: 'ist',
    })
    expect(parsed.lat).toBe(26.9239)
  })

  it('rejects latitude outside India bounds', () => {
    const res = dimensionsSchema.safeParse({
      yantraType: 'samrat',
      lat: 45,
      long: 75.8,
      sizeParam: 22.6,
      unit: 'm',
      referenceMeridian: 'ist',
    })
    expect(res.success).toBe(false)
  })

  it('rejects non-positive size', () => {
    const res = dimensionsSchema.safeParse({
      yantraType: 'samrat',
      lat: 26.9,
      long: 75.8,
      sizeParam: -5,
      unit: 'm',
      referenceMeridian: 'ist',
    })
    expect(res.success).toBe(false)
  })
})
