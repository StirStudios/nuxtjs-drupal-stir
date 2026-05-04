import { defineEventHandler, getCookie, getHeader } from 'h3'
import { buildDrupalHeaders } from '../../utils/drupalHeaders'

type AuthSessionResponse = {
  authenticated?: boolean
  uid?: number
  name?: string
  mail?: string
  roles?: string[]
  user?: Record<string, unknown> | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const drupalCeConfig =
    config.public.drupalCe && typeof config.public.drupalCe === 'object'
      ? (config.public.drupalCe as Record<string, unknown>)
      : {}
  const drupalApi = String(
    drupalCeConfig.drupalBaseUrl || config.public.api || '',
  ).replace(/\/+$/, '')
  const protectedAuthenticated = getCookie(event, 'protected_access') === '1'

  if (!drupalApi) {
    return {
      authenticated: false,
      protectedAuthenticated,
      user: null,
    }
  }

  try {
    const cookie = getHeader(event, 'cookie')
    const response = await $fetch<AuthSessionResponse>(
      `${drupalApi}/api/auth/session`,
      {
        headers: buildDrupalHeaders({
          cookie: cookie ? String(cookie) : undefined,
          apiKey: String(config.apiKey || ''),
        }),
      },
    )

    return {
      authenticated: Boolean(response?.authenticated),
      protectedAuthenticated,
      user: response?.user ?? {
        uid: response?.uid ?? 0,
        name: response?.name ?? '',
        mail: response?.mail ?? '',
        roles: response?.roles ?? [],
      },
    }
  } catch {
    // Keep auth checks non-fatal so login page can still render.
    return {
      authenticated: false,
      protectedAuthenticated,
      user: null,
    }
  }
})
