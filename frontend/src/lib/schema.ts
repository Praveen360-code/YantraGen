// Zod schemas for form validation on the frontend (mirrors backend rules).
import { z } from 'zod'

export const indiaBounds = {
  lat: { min: 6, max: 37 },
  long: { min: 68, max: 97 },
}

export const dimensionsSchema = z.object({
  yantraType: z.string().min(1, 'Choose an instrument'),
  lat: z
    .number({ invalid_type_error: 'Latitude is required' })
    .min(indiaBounds.lat.min, `Min latitude ${indiaBounds.lat.min}N`)
    .max(indiaBounds.lat.max, `Max latitude ${indiaBounds.lat.max}N`),
  long: z
    .number({ invalid_type_error: 'Longitude is required' })
    .min(indiaBounds.long.min, `Min longitude ${indiaBounds.long.min}E`)
    .max(indiaBounds.long.max, `Max longitude ${indiaBounds.long.max}E`),
  sizeParam: z
    .number({ invalid_type_error: 'Size is required' })
    .positive('Size must be positive')
    .max(1000, 'Size too large'),
  unit: z.enum(['m', 'ft']),
  referenceMeridian: z.enum(['ist', 'ujjain', 'greenwich']),
})

export type DimensionsFormValues = z.infer<typeof dimensionsSchema>
