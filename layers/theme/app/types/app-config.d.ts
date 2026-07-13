// Nuxt app config is intentionally extensible so downstream layers can add
// project-specific keys without augmenting every branch up front.
type LooseRecord = Record<string, unknown>
type ClassValue = string
type UiColorName = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'
type UiButtonVariantName = 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link' | 'material'
type UiFieldVariantName = 'outline' | 'soft' | 'subtle' | 'ghost' | 'none' | 'material'
type UiNavigationVariantName = 'link' | 'pill'
type UiSizeName = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type StirThemeButtonLikeConfig = {
  class?: ClassValue
  color?: UiColorName
  icon?: string
  size?: UiSizeName
  variant?: UiButtonVariantName
} & LooseRecord

type ProtectedRoutesConfig = {
  requireLoginPaths?: string[]
  loginPath?: string
  redirectOnLogin?: string
  allowAuthenticatedUserBypass?: boolean
  fallbackRedirectPath?: string
} & LooseRecord

type AuthIntegrationConfig = {
  drupalAccounts?: boolean
} & LooseRecord

type PlausibleConfig = {
  enabled?: boolean
  domain?: string
  apiHost?: string
} & LooseRecord

type AnalyticsConfig = {
  plausible?: PlausibleConfig
} & LooseRecord

type ThirdPartyScriptsConfig = {
  allowedOrigins?: {
    calculator?: string[]
    enzuzo?: string[]
  }
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
  mode?: 'fixed' | 'sticky'
  modeRoutes?: Partial<Record<'fixed' | 'sticky', string[]>>
  logo?: boolean
  logoClass?: ClassValue
  logoScrolledClass?: ClassValue
  hidden?: boolean
  transparentAtTop?: boolean
  base?: ClassValue
  background?: ClassValue
  container?: ClassValue
  color?: UiColorName
  variant?: UiNavigationVariantName
  desktopLayout?: 'default' | 'split-logo' | string
  logoMenuMarker?: string
  toggleDirection?: 'left' | 'right' | string
  header?: ClassValue
  splitLogo?: {
    center?: ClassValue
    container?: ClassValue
    desktopNav?: ClassValue
    leftNav?: ClassValue
    logoLink?: ClassValue
    mobileLogo?: ClassValue
    mobileLeft?: ClassValue
    right?: ClassValue
    rightNav?: ClassValue
  } & LooseRecord
  highlight?: {
    show?: boolean
    color?: UiColorName
  } & LooseRecord
  slideover?: {
    logo?: boolean
    angle?: boolean
    angleDeg?: number
    angleOffsetX?: number | string
    link?: ClassValue
    list?: ClassValue
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
    heading?: ClassValue
    base?: ClassValue
    isFront?: ClassValue
  } & LooseRecord
  hide?: ClassValue
} & LooseRecord

type StirThemeFrontPageConfig = {
  heading?: ClassValue
  main?: ClassValue
} & LooseRecord

type StirThemeSocialConfig = {
  title?: string
  tooltip?: string
  url?: string
  icon?: string
  iconSize?: ClassValue
} & LooseRecord

type StirThemeFooterConfig = {
  base?: ClassValue
  container?: ClassValue
  content?: ClassValue
  layout?: 'default' | 'columns' | 'stacked' | string
  logo?: ClassValue
  menu?: ClassValue
  menuItem?: ClassValue
  menuList?: ClassValue
  requireSiteName?: boolean
  rights?: string
  left?: ClassValue
  right?: ClassValue
  sections?: {
    left?: string[]
    center?: string[]
    right?: string[]
  } & LooseRecord
  showCopyright?: boolean
  showEmail?: boolean
  showFooterRegion?: boolean
  showLogo?: boolean
  showMenu?: boolean
  showPoweredBy?: boolean
  showSlogan?: boolean
  showSocials?: boolean
  showSubFooterRegion?: boolean
  copyright?: ClassValue
  email?: ClassValue
  footerLinks?: ClassValue
  poweredBy?: ClassValue
  slogan?: ClassValue
  socialIcon?: ClassValue
  socials?: ClassValue
} & LooseRecord

type StirThemeMediaConfig = {
  base?: ClassValue
  rounded?: ClassValue
  video?: {
    loadMinWidth?: number
    loadStrategy?: 'after-load' | 'immediate'
    wrapper?: ClassValue
  }
  transitions?: Record<string, ClassValue>
  effects?: Record<string, ClassValue>
} & LooseRecord

type StirThemeCarouselConfig = {
  padding?: ClassValue
  root?: ClassValue
  arrows?: {
    prev?: StirThemeButtonLikeConfig
    next?: StirThemeButtonLikeConfig
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
  formClass?: ClassValue
  labels?: {
    floating?: boolean
    base?: string | string[]
  } & LooseRecord
  fieldGroupHeader?: ClassValue
  fieldGroup?: ClassValue
  fieldInput?: ClassValue
  fieldText?: ClassValue
  response?: ClassValue
  description?: ClassValue
  help?: ClassValue
  submitAlign?: ClassValue
  submitComponent?: string
  buttonClass?: ClassValue
  submitButtonSize?: UiSizeName
  fieldVariant?: UiFieldVariantName
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
  variant?: UiButtonVariantName
  showAtScrollY?: number
} & LooseRecord

type StirThemeErrorConfig = {
  label?: string
  color?: UiColorName
  size?: UiSizeName
  icon?: string
  variant?: UiButtonVariantName
} & LooseRecord

export type StirThemeAuthConfig = {
  backgroundImage?: string
  layout?: 'card' | 'page-split' | 'card-split'
  imagePosition?: 'left' | 'right'
  showIcon?: boolean
  backButton?: StirThemeAuthBackButtonConfig
  submitButton?: StirThemeButtonLikeConfig
  pages?: Partial<Record<StirThemeAuthPageKey, StirThemeAuthPageConfig>>
} & LooseRecord

type StirThemeAuthPageKey =
  | 'login'
  | 'logout'
  | 'protectedPage'
  | 'register'
  | 'passwordRequest'
  | 'passwordReset'
  | 'verify'

export type StirThemeAuthPageConfig = {
  backgroundImage?: string
  layout?: 'card' | 'page-split' | 'card-split'
  imagePosition?: 'left' | 'right'
  showIcon?: boolean
  backButton?: StirThemeAuthBackButtonConfig
} & LooseRecord

export type StirThemeAuthBackButtonConfig = StirThemeButtonLikeConfig & {
  enabled?: boolean
  label?: string
  to?: string
}

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
  showPdf?: boolean
  showBreadcrumbs?: boolean
  loadingIndicator?: string | false
  heading?: ClassValue
  container?: ClassValue
  header?: ClassValue
  navigation?: StirThemeNavigationConfig
  hero?: StirThemeHeroConfig
  frontPage?: StirThemeFrontPageConfig
  socials?: StirThemeSocialConfig[]
  footer?: StirThemeFooterConfig
  media?: StirThemeMediaConfig
  carousel?: StirThemeCarouselConfig
  mediaModal?: StirThemeModalConfig
  overlay?: StirThemeOverlayConfig
  webform?: StirThemeWebformConfig
  turnstile?: StirThemeTurnstileConfig
  card?: StirThemeCardConfig
  gradients?: Record<string, ClassValue>
  animations?: StirThemeAnimationsConfig
  scrollButton?: StirThemeScrollButtonConfig
  error?: StirThemeErrorConfig
  auth?: StirThemeAuthConfig
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
  video: NonNullable<StirThemeMediaConfig['video']>
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
  showPdf: boolean
  showBreadcrumbs: boolean
  heading: ClassValue
  container: ClassValue
  header: ClassValue
  navigation: ResolvedStirThemeNavigationConfig
  hero: ResolvedStirThemeHeroConfig
  frontPage: StirThemeFrontPageConfig
  socials: StirThemeSocialConfig[]
  footer: StirThemeFooterConfig
  media: ResolvedStirThemeMediaConfig
  carousel: ResolvedStirThemeCarouselConfig
  mediaModal: ResolvedStirThemeModalConfig
  overlay: StirThemeOverlayConfig
  webform: ResolvedStirThemeWebformConfig
  turnstile: StirThemeTurnstileConfig
  card: ResolvedStirThemeCardConfig
  gradients: Record<string, ClassValue>
  animations: StirThemeAnimationsConfig
  scrollButton: StirThemeScrollButtonConfig
  error: StirThemeErrorConfig
  auth: StirThemeAuthConfig
}

declare module 'nuxt/schema' {
  interface AppConfigInput {
    protectedRoutes?: ProtectedRoutesConfig
    authIntegration?: AuthIntegrationConfig
    analytics?: AnalyticsConfig
    thirdPartyScripts?: ThirdPartyScriptsConfig
    userway?: UserwayConfig
    privacyNotice?: PrivacyNoticeConfig
    popup?: PopupConfig
    cmsGlobalSeo?: CmsGlobalSeoConfig
    colorMode?: ColorModeConfig
    stirTheme?: StirThemeConfig
  }

  interface AppConfig {
    protectedRoutes: ProtectedRoutesConfig
    authIntegration: AuthIntegrationConfig
    analytics: AnalyticsConfig
    thirdPartyScripts: ThirdPartyScriptsConfig
    userway: UserwayConfig
    privacyNotice: PrivacyNoticeConfig
    popup: PopupConfig
    cmsGlobalSeo: CmsGlobalSeoConfig
    colorMode: ColorModeConfig
    stirTheme: ResolvedStirThemeConfig
  }
}

export {}
