import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import type { WebformFieldProps } from '#stir/types'

export function resolveWebformBoolean(value: unknown): boolean {
  return resolveBooleanProp(value)
}

export function resolveWebformFieldType(field: WebformFieldProps): string {
  const rawType = String(field['#type'] ?? '').trim().toLowerCase()
  const inputType =
    field['#input_type'] ??
    field['#inputType'] ??
    field['#widget'] ??
    (field['#attributes'] as Record<string, unknown> | undefined)?.type
  const normalizedInputType = String(inputType ?? '').trim().toLowerCase()

  if (rawType.includes('range')) return 'range'
  if (rawType === 'number' && normalizedInputType === 'range') return 'range'

  return rawType
}

export function resolveWebformCardinality(value: unknown): number {
  if (resolveWebformBoolean(value)) return 1

  const cardinality = Number(value)

  return Number.isFinite(cardinality) && cardinality > 0 ? cardinality : 1
}

export function resolveWebformMultiple(value: unknown): boolean {
  if (value === true || value === 'true' || value === '1') return true

  const cardinality = Number(value)

  return Number.isFinite(cardinality) && cardinality > 1
}
