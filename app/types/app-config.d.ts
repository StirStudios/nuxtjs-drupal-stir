type LooseRecord = Record<string, unknown>

type ProtectedRoutesConfig = {
  requireLoginPaths?: string[]
  loginPath?: string
  redirectOnLogin?: string
} & LooseRecord

type PlausibleConfig = {
  enabled?: boolean
  domain?: string
  scriptUrl?: string
} & LooseRecord

type AnalyticsConfig = {
  plausible?: PlausibleConfig
} & LooseRecord

type UserwayConfig = {
  enabled?: boolean
  account?: string
  position?: number
  size?: 'small' | 'medium' | 'large'
  color?: string
  type?: string
} & LooseRecord

type CookieConsentConfig = {
  enabled?: boolean
  title?: string
  message?: string
  messageLinks?: string
  buttonLabel?: string
  termsUrl?: string
  privacyUrl?: string
} & LooseRecord

type PopupConfig = {
  enabled?: boolean
} & LooseRecord

type ColorModeConfig = {
  forced?: boolean
  preference?: 'light' | 'dark' | 'system'
  showToggle?: boolean
  lightRoutes?: string[]
  darkRoutes?: string[]
} & LooseRecord

declare module 'nuxt/schema' {
  interface AppConfigInput {
    protectedRoutes?: ProtectedRoutesConfig
    analytics?: AnalyticsConfig
    userway?: UserwayConfig
    cookieConsent?: CookieConsentConfig
    popup?: PopupConfig
    colorMode?: ColorModeConfig
  }

  interface AppConfig {
    protectedRoutes: ProtectedRoutesConfig
    analytics: AnalyticsConfig
    userway: UserwayConfig
    cookieConsent: CookieConsentConfig
    popup: PopupConfig
    colorMode: ColorModeConfig
  }
}

export {}
