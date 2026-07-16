import { computed, type ComputedRef } from 'vue'

export type OptionalScriptConsent = {
  allowsNonEssential: ComputedRef<boolean>
}

const allowAllScripts = computed(() => true)

export function useOptionalScriptConsent() {
  const nuxtApp = useNuxtApp()

  return nuxtApp.$stirScriptConsent ?? {
    allowsNonEssential: allowAllScripts,
  }
}

declare module '#app' {
  interface NuxtApp {
    $stirScriptConsent?: OptionalScriptConsent
  }
}
