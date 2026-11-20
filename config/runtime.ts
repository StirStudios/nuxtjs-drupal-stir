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

// Each deployed build gets its own asset folder, /_nuxt/<build id>/. A chunk's
// hash does not cover the stylesheet name it injects, so two builds can ship
// the same file name with different contents, and an immutable CDN copy of
// the old one then loads the old CSS. The ID is STIR_BUILD_ID or the commit in
// Capistrano's REVISION file, so every machine that builds a release agrees.
// Without either (local, CI and test builds) the folder stays /_nuxt/.
export function buildAssetsDirectory(
  buildId: string | undefined,
  revision: string | undefined,
): string | undefined {
  const id = (buildId?.trim() || revision?.trim().slice(0, 12) || '')

  return /^[\w-]{1,64}$/.test(id) ? `/_nuxt/${id}/` : undefined
}
