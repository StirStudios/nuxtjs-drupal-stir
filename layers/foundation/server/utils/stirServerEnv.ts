/**
 * Reads a server secret at runtime, falling back to its build-time value.
 *
 * nuxt.config.ts reads process.env while Nuxt builds, so those values are
 * frozen into the bundle, and Nuxt only overrides them at runtime from
 * NUXT_-prefixed variables. The server loads the site's shared .env into the
 * process, so reading the plain name here lets an edit apply on a pm2 reload,
 * without a rebuild.
 */
export function stirServerEnv(name: string, buildTimeValue: unknown): string {
  const runtimeValue = process.env[name]?.trim()

  return runtimeValue || String(buildTimeValue || '')
}
