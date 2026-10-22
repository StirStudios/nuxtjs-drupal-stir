export function normalizeEnvironmentUrl(value: string | undefined): string {
  return (value || '').replace(/\/+$/, '')
}

export function positiveIntegerEnvironment(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function commaSeparatedEnvironment(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

type Environment = Record<string, string | undefined>

/**
 * Reads the first set name: the canonical one first, then the old names it
 * replaces. When the canonical and an old name disagree the canonical wins
 * and a warning names (never prints) the variables.
 */
export function canonicalEnvironment(
  names: readonly [string, ...string[]],
  env: Environment = process.env,
): string | undefined {
  const set = names.filter(name => env[name]?.trim())
  const [first] = set
  const value = first ? env[first]?.trim() : undefined
  const conflicting = set.filter(name => env[name]?.trim() !== value)

  if (conflicting.length) {
    console.warn(`[stir] ${first} overrides ${conflicting.join(', ')}, which has a different value.`)
  }

  return value
}

/** Public site origin: NUXT_SITE_URL, else the old NUXT_URL. */
export function siteUrlEnvironment(env: Environment = process.env): string {
  return canonicalEnvironment(['NUXT_SITE_URL', 'NUXT_URL'], env) || ''
}

/** Site name: NUXT_SITE_NAME, else the old NUXT_NAME. */
export function siteNameEnvironment(env: Environment = process.env): string | undefined {
  return canonicalEnvironment(['NUXT_SITE_NAME', 'NUXT_NAME'], env)
}

/**
 * Vite dev-server host: the NUXT_SITE_URL host, else the old
 * SERVER_DOMAIN_CLIENT, else localhost.
 */
export function developmentHostEnvironment(env: Environment = process.env): string {
  const siteUrl = env.NUXT_SITE_URL?.trim()

  if (siteUrl && URL.canParse(siteUrl)) {
    return new URL(siteUrl).hostname
  }

  return env.SERVER_DOMAIN_CLIENT?.trim() || 'localhost'
}
