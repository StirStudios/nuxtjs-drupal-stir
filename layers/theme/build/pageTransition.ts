/**
 * Nuxt's `experimental.viewTransition` for a `stirTheme.pageTransition.type`.
 * `true` rather than 'always', so Nuxt skips the transition when the visitor
 * prefers reduced motion.
 */
export function pageTransitionViewTransition(type: string | undefined): boolean {
  return type === 'crossfade'
}
