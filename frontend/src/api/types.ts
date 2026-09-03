// Shared API types mirroring the FastAPI responses.

export interface GeometryValueDto {
  key: string
  label: string
  value: number
  unit: string
  formula: string
  reference: string
}

export interface HourLineDto {
  hour: number
  angle_deg: number
  formula: string
}

export interface ValidationDto {
  valid: boolean
  errors: string[]
  warnings: string[]
  yantra_type: string
  yantra_known: boolean
}

export interface DimensionsResponse {
  yantra_type: string
  lat: number
  lon: number
  size_param: { key: string; value: number; unit: string }
  values: GeometryValueDto[]
  hour_lines: HourLineDto[]
  svg: {
    [viewName: string]: string
  }
  validation: ValidationDto
  meta: {
    display_name: string
    description: string
    disclaimer: string
    references: string[]
  }
}

export interface InstrumentDto {
  type: string
  name: string
  description: string
  required_params: string[]
  status: 'ready' | 'coming_soon'
}

export interface ReferenceSiteDto {
  id: string
  name: string
  lat: number
  lon: number
  note: string
}

// Form model submitted to the dimensions endpoint.
export interface DimensionsForm {
  yantraType: string
  lat: number
  long: number
  sizeParam: number
  unit: 'm' | 'ft'
  referenceMeridian: 'ist' | 'ujjain' | 'greenwich'
}
