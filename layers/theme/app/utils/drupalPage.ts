import type { InjectionKey } from 'vue'
import type { useStirDrupalCe } from '../composables/useStirDrupalCe'

export const drupalPageKey: InjectionKey<ReturnType<ReturnType<typeof useStirDrupalCe>['getPage']>> = Symbol('stir-drupal-page')

/** Drupal renders the front page and the catch-all slug route; other routes are Nuxt pages. */
export function isDrupalRenderedRoute(route: { params: object, path: string }): boolean {
  return route.path === '/' || Object.hasOwn(route.params, 'slug')
}
