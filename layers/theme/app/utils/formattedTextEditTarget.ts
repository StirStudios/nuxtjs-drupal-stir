import type { FormattedTextEditTarget } from '#stir/types'

function stringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : ''
}

export function normalizeFormattedTextEditTarget(
  value: unknown,
): FormattedTextEditTarget | null {
  if (!value || typeof value !== 'object') return null

  const target = value as Record<string, unknown>
  const entityType = stringValue(target.entityType ?? target.entity_type)
  const entityId = stringValue(target.entityId ?? target.entity_id)
  const fieldName = stringValue(target.fieldName ?? target.field_name)

  if (
    !/^[a-z0-9_]+$/.test(entityType)
    || !/^\d+$/.test(entityId)
    || !/^[a-z0-9_]+$/.test(fieldName)
  ) {
    return null
  }

  return { entityType, entityId, fieldName }
}

export function formattedTextApiPath(
  target: FormattedTextEditTarget,
): string {
  return [
    '/api/formatted-text',
    target.entityType,
    String(target.entityId),
    target.fieldName,
  ].join('/')
}
