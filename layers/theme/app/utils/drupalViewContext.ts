import type { DrupalViewQueryNamespaceIdentity } from './drupalViewQueryNamespace'
import type { ComputedRef, InjectionKey } from 'vue'

export const drupalViewQueryNamespaceKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('stirDrupalViewQueryNamespace')

export const drupalViewQueryIdentityKey: InjectionKey<ComputedRef<DrupalViewQueryNamespaceIdentity>> =
  Symbol('stirDrupalViewQueryIdentity')
