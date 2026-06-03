export type PageRequestRoute = {
  path: string
  fullPath: string
}

type PageRequestQueryValue = string | null | Array<string | null> | undefined

export function resolvePageRequest(route: PageRequestRoute) {
  return {
    path: route.path,
    key: route.fullPath.split('#')[0] ?? route.path,
  }
}

export function sanitizePageRequestQuery(
  query: Record<string, PageRequestQueryValue>,
): Record<string, string | string[]> {
  const sanitized: Record<string, string | string[]> = {}

  for (const [key, rawValue] of Object.entries(query)) {
    const value = sanitizePageRequestQueryValue(rawValue)

    if (Array.isArray(value) && value.length > 0) {
      sanitized[key] = value
    } else if (typeof value === 'string' && value.length > 0) {
      sanitized[key] = value
    }
  }

  return sanitized
}

function sanitizePageRequestQueryValue(
  value: PageRequestQueryValue,
): string | string[] | undefined {
  if (Array.isArray(value)) {
    const values = value.filter(isSafePageRequestQueryValue)

    return values.length > 0 ? values : undefined
  }

  return isSafePageRequestQueryValue(value) ? value : undefined
}

function isSafePageRequestQueryValue(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !hasEmbeddedQuery(value)
}

function hasEmbeddedQuery(value: string): boolean {
  return /[?&][\w%.-]+=/u.test(value)
}
