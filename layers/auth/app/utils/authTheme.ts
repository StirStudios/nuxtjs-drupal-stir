import type {
  AuthCardConfig,
  AuthChrome,
  AuthSecondaryActionConfig,
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

const isAuthChrome = (value: unknown): value is AuthChrome =>
  value === 'none' || value === 'header' || value === 'full'

/** The page's chrome, then the auth-wide chrome, then none. */
export const resolveAuthChrome = (
  authTheme: AuthThemeConfig,
  pageKey: AuthPageKey | null,
): AuthChrome => {
  const pageChrome = pageKey ? authTheme.pages?.[pageKey]?.chrome : undefined

  if (isAuthChrome(pageChrome)) return pageChrome
  return isAuthChrome(authTheme.chrome) ? authTheme.chrome : 'none'
}

/**
 * Title classes for the auth form and status panels. Utilities beat the base
 * h1 styles on their own, so a site's titleClass replaces these without `!`.
 */
export const defaultAuthTitleClass = 'mb-0 text-xl leading-7 font-semibold'

export const resolveAuthTitleClass = (authTheme: AuthThemeConfig | undefined): string =>
  typeof authTheme?.titleClass === 'string' && authTheme.titleClass.trim()
    ? authTheme.titleClass.trim()
    : defaultAuthTitleClass

/** The page's secondary action merged over the auth-wide one. */
export const resolveAuthSecondaryAction = (
  authTheme: AuthThemeConfig,
  pageKey: AuthPageKey | null,
): AuthSecondaryActionConfig => ({
  ...authTheme.secondaryAction,
  ...(pageKey ? authTheme.pages?.[pageKey]?.secondaryAction : {}),
})

/**
 * Whether a page without its own default link, such as the protected gate,
 * shows the secondary action: only when a label and destination are set and
 * it isn't disabled.
 */
export const hasConfiguredSecondaryAction = (
  authTheme: AuthThemeConfig,
  pageKey: AuthPageKey | null,
): boolean => {
  const action = resolveAuthSecondaryAction(authTheme, pageKey)

  return action.enabled !== false && Boolean(action.label && action.to)
}

/** The Nuxt layout and props that render an auth page's chrome. */
export const authChromeLayout = (
  chrome: AuthChrome,
): { name: string | false, props?: { footer: boolean } } =>
  chrome === 'none'
    ? { name: false }
    : { name: 'default', props: { footer: chrome === 'full' } }
