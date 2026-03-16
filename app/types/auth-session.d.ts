import type { Ref } from 'vue'

type UserSessionShape = {
  ready: Ref<boolean>
  loggedIn: Ref<boolean>
  fetch: () => Promise<void>
}

declare global {
  function useUserSession(): UserSessionShape
  function setUserSession(
    event: unknown,
    payload: Record<string, unknown>,
  ): Promise<void>
}

export {}
