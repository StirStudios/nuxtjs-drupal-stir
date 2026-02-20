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

type PrivacyNoticeConfig = {
  enabled?: boolean
  mode?: 'consent' | 'notice'
  position?: 'left' | 'center' | 'right'
  dismissible?: boolean
  title?: string
  message?: string
  messageLinks?: string
  buttonLabel?: string
  declineButtonLabel?: string
  termsUrl?: string
  privacyUrl?: string
} & LooseRecord

type CookieConsentConfig = PrivacyNoticeConfig

type PopupConfig = {
  enabled?: boolean
  includePaths?: string[]
  excludePaths?: string[]
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
    privacyNotice?: PrivacyNoticeConfig
    cookieConsent?: CookieConsentConfig
    popup?: PopupConfig
    colorMode?: ColorModeConfig
  }

  interface AppConfig {
    protectedRoutes: ProtectedRoutesConfig
    analytics: AnalyticsConfig
    userway: UserwayConfig
    privacyNotice: PrivacyNoticeConfig
    cookieConsent: CookieConsentConfig
    popup: PopupConfig
    colorMode: ColorModeConfig
  }
}

export {}
