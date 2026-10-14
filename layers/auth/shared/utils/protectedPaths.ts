/**
 * Protected-route path matching shared by the route middleware and the server
 * boundary.
 *
 * The client middleware gates navigation while the server middleware gates the
 * data behind it. Both must agree on what "protected" means, so the rule lives
 * here rather than being written twice.
 */

// Drupal resolves path aliases case-insensitively and decodes the request path,
// so /Clients/vendors and /%63lients/vendors reach the same node as
// /clients/vendors. Matching runs on a canonical form that folds every variant
// Drupal (or a server in front of it) might treat as equal. Over-folding only
// widens the protected set, which is the safe direction.
export function canonicalizeStirProtectedPath(path: string): string {
  let decoded = path

  try {
    decoded = decodeURIComponent(path)
  } catch {
    // Malformed escapes are left as-is; the CE proxy rejects them.
  }

  const hasTrailingSlash = /\/$/.test(decoded) && decoded.replace(/\/+/g, '/') !== '/'
  const segments: string[] = []

  for (const rawSegment of decoded.replace(/\\/g, '/').split('/')) {
    const segment = rawSegment.split(';')[0]!

    if (segment === '..') {
      segments.pop()
      continue
    }

    // Trailing dots and whitespace are dropped by some servers and filesystems.
    const trimmed = segment.replace(/[.\s]+$/, '')

    if (trimmed) segments.push(trimmed)
  }

  // Upper-then-lower folds characters such as U+017F (long s) and U+212A
  // (Kelvin sign) that a plain toLowerCase() leaves distinct.
  const folded = `/${segments.join('/')}`.normalize('NFKC').toUpperCase().toLowerCase()

  return hasTrailingSlash && folded !== '/' ? `${folded}/` : folded
}

export function matchesStirProtectedPath(
  routePath: string,
  rule: string,
): boolean {
  if (!rule.trim()) return false

  const path = canonicalizeStirProtectedPath(routePath)
  const normalizedRule = canonicalizeStirProtectedPath(rule.trim())

  if (normalizedRule === '/') return path === '/'
  if (normalizedRule.endsWith('/')) {
    return path.startsWith(normalizedRule)
  }

  return path === normalizedRule || path === `${normalizedRule}/`
}

export function normalizeStirProtectedPaths(value: unknown): string[] {
  return (Array.isArray(value) ? value : []).filter(
    (path): path is string => typeof path === 'string' && path.trim().length > 0,
  )
}

export function isStirProtectedPath(
  routePath: string,
  rules: readonly string[],
): boolean {
  return rules.some(rule => matchesStirProtectedPath(routePath, rule))
}
