import type { InjectionKey } from 'vue'
import type { useStirDrupalCe } from '../composables/useStirDrupalCe'

export const drupalPageKey: InjectionKey<ReturnType<ReturnType<typeof useStirDrupalCe>['getPage']>> = Symbol('stir-drupal-page')
