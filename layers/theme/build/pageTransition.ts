import type { NuxtOptions } from '@nuxt/schema'

/**
 * Nuxt's `experimental.viewTransition` for a `stirTheme.pageTransition.type`.
 * `true` rather than 'always', so Nuxt skips the transition when the visitor
 * prefers reduced motion.
 */
export function pageTransitionViewTransition(type: string | undefined): boolean {
  return type === 'crossfade'
}


/**
 * Turns on Nuxt's view transitions after its config has resolved. Nuxt reads
 * `experimental.viewTransition` once, into `app.viewTransition`, when it loads
 * the config, and its plugin follows `app.viewTransition.enabled`; setting only
 * `experimental` late adds the plugin but leaves it switched off.
 */
export function enableViewTransition(options: Pick<NuxtOptions, 'app' | 'experimental'>): void {
  options.experimental.viewTransition = true
  const current = options.app.viewTransition

  options.app.viewTransition = typeof current === 'object' && current
    ? { ...current, enabled: true }
    : { enabled: true }
}
