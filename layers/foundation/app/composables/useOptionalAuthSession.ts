import type { Ref } from 'vue'

/**
 * The session surface other layers may read when the auth layer is present.
 */
export type StirAuthSessionState = {
  ready: Ref<boolean>
  loggedIn: Ref<boolean>
  user: Ref<{
    uid?: number | string
    capabilities?: { editorialUi?: boolean } | null
  } | null>
  fetchSession: () => Promise<void>
}

/**
 * Returns the auth layer's session, or null in presets without that layer.
 *
 * The auth layer registers it from a plugin, so layers that only need to know
 * whether someone is signed in never import auth code or call its routes.
 */
export function useOptionalAuthSession(): StirAuthSessionState | null {
  const nuxtApp = useNuxtApp() as unknown as { $stirAuthSession?: StirAuthSessionState }

  return nuxtApp.$stirAuthSession ?? null
}
