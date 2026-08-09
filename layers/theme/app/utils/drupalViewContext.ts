import type { ComputedRef, InjectionKey } from 'vue'

export const drupalViewQueryNamespaceKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('stirDrupalViewQueryNamespace')
