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
  const entityType = stringValue(target.entityType)
  const entityId = stringValue(target.entityId)
  const fieldName = stringValue(target.fieldName)
  const editorModeRaw = stringValue(target.editorMode)
  const editorMode = editorModeRaw === 'heading' ? 'heading' : editorModeRaw === 'plain' ? 'plain' : 'formatted'

  if (
    !/^[a-z0-9_]+$/.test(entityType)
    || !/^\d+$/.test(entityId)
    || !/^[a-z0-9_]+$/.test(fieldName)
  ) {
    return null
  }

  return { entityType, entityId, fieldName, editorMode }
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
