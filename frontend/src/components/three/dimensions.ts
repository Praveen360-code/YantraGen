import type { GeometryValueDto } from '../../api/types'

// Map of dimension key -> resolved value, plus labelled entries for display.
export interface DimensionMap {
  sizeParam: number
  unit: string
  byKey: Record<string, number>
  labels: { key: string; label: string; value: number; unit: string }[]
}

export function buildDimensionMap(
  sizeParam: { key: string; value: number; unit: string },
  values: GeometryValueDto[],
): DimensionMap {
  const byKey: Record<string, number> = { [sizeParam.key]: sizeParam.value }
  for (const v of values) byKey[v.key] = v.value

  const labels = values.map((v) => ({
    key: v.key,
    label: v.label,
    value: v.value,
    unit: v.unit,
  }))

  return {
    sizeParam: sizeParam.value,
    unit: sizeParam.unit,
    byKey,
    labels,
  }
}
