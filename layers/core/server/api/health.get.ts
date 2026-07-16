import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  const value = useRuntimeConfig().public.stirPresentationBuild
  const build = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : null
  const presentation = build
    ? {
        manifestRevision: String(build.manifestRevision || ''),
        sourceRevision: String(build.sourceRevision || ''),
        mode: String(build.mode || ''),
        schemaVersion: Number(build.schemaVersion || 0),
        siteUuid: String(build.siteUuid || ''),
        theme: String(build.theme || ''),
      }
    : null

  return {
    ok: true,
    service: 'nuxtjs-drupal-stir',
    presentation,
  }
})
