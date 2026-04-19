// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseRecord = Record<string, any>

type ProtectedRoutesConfig = {
  requireLoginPaths?: string[]
  loginPath?: string
  redirectOnLogin?: string
} & LooseRecord

type PlausibleConfig = {
  enabled?: boolean
  domain?: string
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

type StirThemeOverlayConfig = {
  portal?: boolean | string | HTMLElement
} & LooseRecord

type StirThemeRevealConfig = {
  durationMs?: number
  threshold?: number
  rootMargin?: string
  staggerMs?: number
  ease?: [number, number, number, number]
} & LooseRecord

type StirThemeAnimationsConfig = {
  once?: boolean
  reveal?: StirThemeRevealConfig
} & LooseRecord

type StirThemeConfig = {
  overlay?: StirThemeOverlayConfig
  animations?: StirThemeAnimationsConfig
} & LooseRecord

declare module 'nuxt/schema' {
  interface AppConfigInput {
    protectedRoutes?: ProtectedRoutesConfig
    analytics?: AnalyticsConfig
    userway?: UserwayConfig
    privacyNotice?: PrivacyNoticeConfig
    popup?: PopupConfig
    colorMode?: ColorModeConfig
    stirTheme?: StirThemeConfig
  }

  interface AppConfig {
    protectedRoutes: ProtectedRoutesConfig
    analytics: AnalyticsConfig
    userway: UserwayConfig
    privacyNotice: PrivacyNoticeConfig
    popup: PopupConfig
    colorMode: ColorModeConfig
    stirTheme: StirThemeConfig
  }
}

export {}
