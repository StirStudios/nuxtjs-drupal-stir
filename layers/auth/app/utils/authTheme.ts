import type {
  AuthCardConfig,
  AuthPageKey,
  AuthThemeConfig,
} from '../types/theme'

type AuthRoute = {
  meta: Record<string, unknown>
  name?: unknown
  path: string
}

const AUTH_PAGE_KEYS = [
  'login',
  'logout',
  'protectedPage',
  'register',
  'passwordRequest',
  'passwordReset',
  'verify',
] as const satisfies readonly AuthPageKey[]

const isAuthPageKey = (value: unknown): value is AuthPageKey =>
  typeof value === 'string' && AUTH_PAGE_KEYS.includes(value as AuthPageKey)

export const resolveAuthPageKey = (
  route: AuthRoute,
): AuthPageKey | null => {
  if (isAuthPageKey(route.meta.authPageKey)) {
    return route.meta.authPageKey
  }

  const routeName = typeof route.name === 'string' ? route.name : ''

  for (const pageKey of AUTH_PAGE_KEYS) {
    const routeSegment = pageKey === 'protectedPage'
      ? 'protected'
      : pageKey.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)

    if (routeName.includes(`auth-${routeSegment}`)) {
      return pageKey
    }
  }

  const path = route.path
  const paths: Record<AuthPageKey, string> = {
    login: '/auth/login',
    logout: '/auth/logout',
    protectedPage: '/auth/protected',
    register: '/auth/register',
    passwordRequest: '/auth/password/request',
    passwordReset: '/auth/password/reset',
    verify: '/auth/verify',
  }

  return AUTH_PAGE_KEYS.find(pageKey => path.endsWith(paths[pageKey])) || null
}

export const resolveAuthCardConfig = (
  authTheme: AuthThemeConfig,
  pageKey: AuthPageKey | null,
): AuthCardConfig => {
  const globalCard = authTheme.card || {}
  const pageCard = pageKey ? authTheme.pages?.[pageKey]?.card || {} : {}

  return {
    ...globalCard,
    ...pageCard,
    ui: {
      ...globalCard.ui,
      ...pageCard.ui,
    },
  }
}
