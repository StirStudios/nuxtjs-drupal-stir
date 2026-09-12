/**
 * Protected-route path matching shared by the route middleware and the server
 * boundary.
 *
 * The client middleware gates navigation while the server middleware gates the
 * data behind it. Both must agree on what "protected" means, so the rule lives
 * here rather than being written twice.
 */

export function matchesStirProtectedPath(
  routePath: string,
  rule: string,
): boolean {
  const normalizedRule = rule.trim()

  if (!normalizedRule) return false
  if (normalizedRule === '/') return routePath === '/'
  if (normalizedRule.endsWith('/')) return routePath.startsWith(normalizedRule)

  return routePath === normalizedRule
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
