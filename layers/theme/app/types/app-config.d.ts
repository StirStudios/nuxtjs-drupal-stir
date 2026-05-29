// Nuxt app config is intentionally extensible so downstream layers can add
// project-specific keys without augmenting every branch up front.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseRecord = Record<string, any>
type ClassValue = string

type ProtectedRoutesConfig = {
  requireLoginPaths?: string[]
  loginPath?: string
  allowAuthenticatedUserBypass?: boolean
} & LooseRecord

type AuthPageCopyConfig = {
  title?: string
  description?: string
  backgroundImage?: string
} & LooseRecord

type AuthSubmitButtonConfig = {
  label?: string
  class?: string
  color?: string
  icon?: string
  loadingIcon?: string
  size?: string
  variant?: string
} & LooseRecord

type AuthConfig = {
  accountEnabled?: boolean
  loginRedirectPath?: string
  logoutRedirectPath?: string
  protectedFallbackRedirectPath?: string
  backgroundImage?: string
  submitButton?: AuthSubmitButtonConfig
  login?: AuthPageCopyConfig
  protectedPage?: AuthPageCopyConfig
  register?: AuthPageCopyConfig
  passwordRequest?: AuthPageCopyConfig
  passwordReset?: AuthPageCopyConfig
} & LooseRecord

type PlausibleConfig = {
  enabled?: boolean
  domain?: string
  apiHost?: string
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

type PrivacyNoticeLink = {
  label?: string
  title?: string
  text?: string
  url?: string
  href?: string
  to?: string
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
  cookieConsentUrl?: string
  cookiePolicyUrl?: string
  links?: PrivacyNoticeLink[]
  legalLinks?: PrivacyNoticeLink[]
} & LooseRecord

type PopupConfig = {
  enabled?: boolean
  component?: string
} & LooseRecord

type CmsGlobalSeoConfig = {
  enabled?: boolean
  ignoredPathPrefixes?: string[]
  ignoredPaths?: string[]
  drupalRouteNames?: string[]
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

type StirThemeNavigationConfig = {
  mode?: 'fixed' | 'sticky' | 'static'
  logo?: boolean
  logoSize?: ClassValue
  logoScrolledSize?: ClassValue
  isHidden?: boolean
  transparentTop?: boolean
  base?: ClassValue
  background?: ClassValue
  container?: ClassValue
  color?: string
  variant?: string
  toggleDirection?: 'left' | 'right' | string
  header?: ClassValue
  highlight?: {
    show?: boolean
    color?: string
  } & LooseRecord
  slideover?: {
    logo?: boolean
    angle?: boolean
    angleDeg?: number
    link?: ClassValue
    body?: ClassValue
  } & LooseRecord
} & LooseRecord

type StirThemeHeroConfig = {
  base?: ClassValue
  mediaSpacing?: ClassValue
  noMediaSpacing?: ClassValue
  noMediaFallback?: ClassValue
  overlay?: ClassValue
  isFront?: ClassValue
  image?: {
    base?: ClassValue
    isFront?: ClassValue
  } & LooseRecord
  text?: {
    h1?: ClassValue
    base?: ClassValue
    isFront?: ClassValue
  } & LooseRecord
  hide?: ClassValue
} & LooseRecord

type StirThemeSocialConfig = {
  title?: string
  tooltip?: string
  url?: string
  icon?: string
  iconSize?: ClassValue
} & LooseRecord

type StirThemeFooterConfig = {
  hideEmail?: boolean
  rights?: string
  base?: ClassValue
  left?: ClassValue
  right?: ClassValue
  footerLinks?: ClassValue
  poweredby?: boolean
} & LooseRecord

type StirThemeMediaConfig = {
  base?: ClassValue
  rounded?: ClassValue
  transitions?: Record<string, ClassValue>
  effects?: Record<string, ClassValue>
} & LooseRecord

type StirThemeCarouselConfig = {
  padding?: ClassValue
  root?: ClassValue
  arrows?: {
    prev?: LooseRecord
    next?: LooseRecord
    prevIcon?: string
    nextIcon?: string
  } & LooseRecord
} & LooseRecord

type StirThemeModalConfig = {
  title?: boolean
  description?: {
    media?: boolean
    default?: boolean
  } & LooseRecord
} & LooseRecord

type StirThemeWebformConfig = {
  showToasts?: boolean
  scrollToTopOnSuccess?: boolean
  scrollToTopOnReset?: boolean
  scrollToTopDelayMs?: number
  scrollToTopFallbackDelayMs?: number
  spacing?: ClassValue
  spacingLarge?: ClassValue
  labels?: {
    floating?: boolean
    base?: string | string[]
  } & LooseRecord
  fieldGroupHeader?: ClassValue
  fieldGroup?: ClassValue
  fieldInput?: ClassValue
  response?: ClassValue
  description?: ClassValue
  help?: ClassValue
  submitAlign?: ClassValue
  buttonSize?: string
  variant?: string
} & LooseRecord

type StirThemeTurnstileConfig = {
  appearance?: 'always' | 'execute' | 'interaction-only'
} & LooseRecord

type StirThemeCardConfig = {
  base?: ClassValue
  effect?: ClassValue
  sizes?: Record<string, ClassValue>
  defaultGradient?: string
} & LooseRecord

type StirThemeScrollButtonConfig = {
  enabled?: boolean
  base?: ClassValue
  icon?: string
  variant?: string
  showAtScrollY?: number
} & LooseRecord

type StirThemeErrorConfig = {
  label?: string
  color?: string
  size?: string
  icon?: string
  variant?: string
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
  pdf?: boolean
  crumbs?: boolean
  loadingIndicator?: string | false
  h1?: ClassValue
  container?: ClassValue
  header?: ClassValue
  navigation?: StirThemeNavigationConfig
  hero?: StirThemeHeroConfig
  socials?: StirThemeSocialConfig[]
  footer?: StirThemeFooterConfig
  media?: StirThemeMediaConfig
  carousel?: StirThemeCarouselConfig
  modal?: StirThemeModalConfig
  overlay?: StirThemeOverlayConfig
  webform?: StirThemeWebformConfig
  turnstile?: StirThemeTurnstileConfig
  card?: StirThemeCardConfig
  gradients?: Record<string, ClassValue>
  animations?: StirThemeAnimationsConfig
  scrollButton?: StirThemeScrollButtonConfig
  error?: StirThemeErrorConfig
} & LooseRecord

type ResolvedStirThemeNavigationConfig = StirThemeNavigationConfig & {
  highlight: NonNullable<StirThemeNavigationConfig['highlight']>
  slideover: NonNullable<StirThemeNavigationConfig['slideover']>
}

type ResolvedStirThemeHeroConfig = StirThemeHeroConfig & {
  image: NonNullable<StirThemeHeroConfig['image']>
  text: NonNullable<StirThemeHeroConfig['text']>
}

type ResolvedStirThemeMediaConfig = StirThemeMediaConfig & {
  transitions: Record<string, ClassValue>
  effects: Record<string, ClassValue>
}

type ResolvedStirThemeCarouselConfig = StirThemeCarouselConfig & {
  arrows: NonNullable<StirThemeCarouselConfig['arrows']>
}

type ResolvedStirThemeModalConfig = StirThemeModalConfig & {
  description: NonNullable<StirThemeModalConfig['description']>
}

type ResolvedStirThemeWebformConfig = StirThemeWebformConfig & {
  labels: NonNullable<StirThemeWebformConfig['labels']>
}

type ResolvedStirThemeCardConfig = StirThemeCardConfig & {
  sizes: Record<string, ClassValue>
}

type ResolvedStirThemeConfig = StirThemeConfig & {
  pdf: boolean
  crumbs: boolean
  h1: ClassValue
  container: ClassValue
  header: ClassValue
  navigation: ResolvedStirThemeNavigationConfig
  hero: ResolvedStirThemeHeroConfig
  socials: StirThemeSocialConfig[]
  footer: StirThemeFooterConfig
  media: ResolvedStirThemeMediaConfig
  carousel: ResolvedStirThemeCarouselConfig
  modal: ResolvedStirThemeModalConfig
  overlay: StirThemeOverlayConfig
  webform: ResolvedStirThemeWebformConfig
  turnstile: StirThemeTurnstileConfig
  card: ResolvedStirThemeCardConfig
  gradients: Record<string, ClassValue>
  animations: StirThemeAnimationsConfig
  scrollButton: StirThemeScrollButtonConfig
  error: StirThemeErrorConfig
}

declare module 'nuxt/schema' {
  interface AppConfigInput {
    protectedRoutes?: ProtectedRoutesConfig
    auth?: AuthConfig
    analytics?: AnalyticsConfig
    userway?: UserwayConfig
    privacyNotice?: PrivacyNoticeConfig
    popup?: PopupConfig
    cmsGlobalSeo?: CmsGlobalSeoConfig
    colorMode?: ColorModeConfig
    stirTheme?: StirThemeConfig
  }

  interface AppConfig {
    protectedRoutes: ProtectedRoutesConfig
    auth: AuthConfig
    analytics: AnalyticsConfig
    userway: UserwayConfig
    privacyNotice: PrivacyNoticeConfig
    popup: PopupConfig
    cmsGlobalSeo: CmsGlobalSeoConfig
    colorMode: ColorModeConfig
    stirTheme: ResolvedStirThemeConfig
  }
}

export {}
