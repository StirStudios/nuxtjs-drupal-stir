export type ViewControlValue = string | string[]

export interface ViewStateSnapshot {
  filters: Record<string, ViewControlValue>
  sorts: Record<string, ViewControlValue>
  page?: number
  savedAt?: number
}

export interface ViewStateStorageIdentity {
  path: string
  viewId?: string
  displayId?: string
  parentUuid?: string
}

export const VIEW_STATE_MAX_AGE_MS = 30 * 60 * 1000

export function cloneViewControlValues(
  values: Record<string, ViewControlValue>,
): Record<string, ViewControlValue> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value,
    ]),
  )
}

export function createViewStateSnapshot(
  filters: Record<string, ViewControlValue>,
  sorts: Record<string, ViewControlValue>,
  page: number,
  savedAt = Date.now(),
): ViewStateSnapshot {
  return {
    filters: cloneViewControlValues(filters),
    sorts: cloneViewControlValues(sorts),
    page,
    savedAt,
  }
}

export function createViewStateStorageKey(
  identity: ViewStateStorageIdentity,
): string {
  return [
    'stir:view-controls',
    identity.path,
    identity.viewId || '',
    identity.displayId || '',
    identity.parentUuid || '',
  ].join(':')
}

export function parseStoredViewState(
  value: string | null,
  now = Date.now(),
  maxAgeMs = VIEW_STATE_MAX_AGE_MS,
): ViewStateSnapshot | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<ViewStateSnapshot>
    const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0

    if (
      !parsed.filters || typeof parsed.filters !== 'object' ||
      !parsed.sorts || typeof parsed.sorts !== 'object' ||
      now - savedAt > maxAgeMs
    ) {
      return null
    }

    return parsed as ViewStateSnapshot
  } catch {
    return null
  }
}
