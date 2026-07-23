import { createError } from 'h3'

export interface FormattedTextRouteTarget {
  entityType: string
  entityId: number
  fieldName: string
}

export function parseFormattedTextRouteTarget(
  params: Record<string, string | undefined> | undefined,
): FormattedTextRouteTarget {
  const entityType = params?.entityType?.trim() || ''
  const entityId = Number(params?.entityId)
  const fieldName = params?.fieldName?.trim() || ''

  if (
    !/^[a-z0-9_]+$/.test(entityType)
    || !Number.isInteger(entityId)
    || entityId <= 0
    || !/^[a-z0-9_]+$/.test(fieldName)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid formatted-text target.',
    })
  }

  return { entityType, entityId, fieldName }
}

export function buildFormattedTextPath(
  ceApiEndpoint: string,
  target: FormattedTextRouteTarget,
): string {
  const { entityType, entityId, fieldName } = target

  return `/api/drupal-ce${ceApiEndpoint}/stir-layout-builder/entity/${entityType}/${entityId}/${fieldName}/text`
}
