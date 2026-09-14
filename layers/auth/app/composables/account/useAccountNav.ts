import type { NavigationMenuItem } from '@nuxt/ui'
import type { MaybeRefOrGetter } from 'vue'
import { resolveAccountNavItems } from '../../utils/accountNav'

/**
 * Decides whether keyed account nav items are shown.
 *
 * Runs inside the setup of the component calling `useAccountNav()`, so it may
 * use composables such as `useFetch` or `useState`. Fetch during SSR when the
 * answer is known on the server, to avoid the item appearing after hydration.
 */
export type AccountNavVisibilityResolver = () => MaybeRefOrGetter<boolean>

type NuxtAppInstance = ReturnType<typeof useNuxtApp>

// Keyed by the per-request app instance, so SSR requests never share resolvers.
const registries = new WeakMap<NuxtAppInstance, Map<string, AccountNavVisibilityResolver>>()

const registryFor = (nuxtApp: NuxtAppInstance) => {
  let registry = registries.get(nuxtApp)

  if (!registry) {
    registry = new Map()
    registries.set(nuxtApp, registry)
  }

  return registry
}

/**
 * Registers the runtime visibility check for items whose `visibility` is `key`.
 *
 * Call from a Nuxt plugin so it is in place before any account nav renders.
 */
export function registerAccountNavVisibility(
  key: string,
  resolver: AccountNavVisibilityResolver,
): void {
  registryFor(useNuxtApp()).set(key, resolver)
}

export function useAccountNav() {
  const appConfig = useAppConfig()
  const registry = registryFor(useNuxtApp())
  const configured = () => appConfig.auth?.accountNav?.items
  const visibility = new Map<string, MaybeRefOrGetter<boolean>>()

  // Run only the resolvers this configuration uses, once per caller.
  for (const entry of configured() || []) {
    const key = entry?.visibility
    const resolver = key ? registry.get(key) : undefined

    if (key && resolver && !visibility.has(key)) {
      visibility.set(key, resolver())
    }
  }

  const items = computed<NavigationMenuItem[]>(() =>
    resolveAccountNavItems(configured(), (key) => {
      const visible = visibility.get(key)

      return visible !== undefined && toValue(visible) === true
    }),
  )

  return {
    items,
  }
}
