export interface DrupalViewQueryNamespaceIdentity {
  queryNamespace?: string
  paragraphUuid?: string
  paragraphId?: number | string
  parentUuid?: string
  uuid?: string
  id?: number | string
  viewId?: string
  displayId?: string
  args?: unknown
}

const MAX_NAMESPACE_LENGTH = 72

export function sanitizeDrupalViewQueryNamespace(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, MAX_NAMESPACE_LENGTH)
    .replace(/_+$/g, '')
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? String(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`
  }

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
    .join(',')}}`
}

function shortStableHash(value: string): string {
  let hash = 0x811c9dc5

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(36)
}

function firstIdentityValue(...values: unknown[]): string {
  for (const value of values) {
    const normalized = sanitizeDrupalViewQueryNamespace(value)

    if (normalized) return normalized
  }

  return ''
}

export function resolveDrupalViewQueryNamespace(
  identity: DrupalViewQueryNamespaceIdentity,
): string {
  const explicit = sanitizeDrupalViewQueryNamespace(identity.queryNamespace)

  if (explicit) return explicit

  const view = sanitizeDrupalViewQueryNamespace(identity.viewId) || 'view'
  const uuid = firstIdentityValue(
    identity.paragraphUuid,
    identity.uuid,
    identity.parentUuid,
  )

  if (uuid) return sanitizeDrupalViewQueryNamespace(`${view}_${uuid}`)

  const paragraphId = firstIdentityValue(identity.paragraphId, identity.id)

  if (paragraphId) {
    return sanitizeDrupalViewQueryNamespace(`${view}_p${paragraphId}`)
  }

  const display = sanitizeDrupalViewQueryNamespace(identity.displayId) || 'default'
  const serializedArgs = stableSerialize(identity.args)
  const argsSuffix = serializedArgs && serializedArgs !== 'undefined'
    ? `_${shortStableHash(serializedArgs)}`
    : ''

  return sanitizeDrupalViewQueryNamespace(`${view}_${display}${argsSuffix}`)
}
