import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  const value = useRuntimeConfig().public.stirPresentationBuild
  const build = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : null
  const presentation = build
    ? { sourceRevision: String(build.sourceRevision || '') }
    : null

  return {
    ok: true,
    service: 'nuxtjs-drupal-stir',
    presentation,
  }
})
