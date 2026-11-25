import type { InjectionKey, Ref } from 'vue'
import type { StirDrupalPage } from '../types/DrupalPage'

export const drupalPageKey: InjectionKey<Readonly<Ref<StirDrupalPage>>> = Symbol('stir-drupal-page')

/** Drupal renders the front page and the catch-all slug route; other routes are Nuxt pages. */
export function isDrupalRenderedRoute(route: { params: object, path: string }): boolean {
  return route.path === '/' || Object.hasOwn(route.params, 'slug')
}
