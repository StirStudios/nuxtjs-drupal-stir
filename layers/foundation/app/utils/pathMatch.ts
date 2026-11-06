export function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.replace(/\/+$/, '')
  }

  return path || '/'
}

/** Exact `paths` match, or a `prefixes` entry followed by `/`; a bare `/` prefix never matches. */
export function isPathIgnored(
  path: string,
  paths: readonly string[] = [],
  prefixes: readonly string[] = [],
): boolean {
  const normalizedPath = normalizePath(path)

  if (paths.some(ignored => normalizePath(ignored) === normalizedPath)) {
    return true
  }

  return prefixes.some((prefix) => {
    const normalizedPrefix = normalizePath(prefix)

    return (
      normalizedPrefix !== '/' &&
      (normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`))
    )
  })
}
