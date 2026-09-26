type LooseRecord = Record<string, unknown>
type ClassValue = string
type UiColorName =
  | 'error'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'neutral'
type UiButtonVariantName =
  | 'solid'
  | 'outline'
  | 'soft'
  | 'subtle'
  | 'ghost'
  | 'link'
  | 'material'
type UiSizeName = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

type AuthButtonConfig = {
  class?: ClassValue
  color?: UiColorName
  icon?: string
  size?: UiSizeName
  variant?: UiButtonVariantName
} & LooseRecord

export type AuthPageKey =
  | 'login'
  | 'logout'
  | 'protectedPage'
  | 'register'
  | 'passwordRequest'
  | 'passwordReset'
  | 'verify'

export type AuthBackButtonConfig = AuthButtonConfig & {
  enabled?: boolean
  label?: string
  to?: string
}

export type AuthSecondaryActionConfig = AuthBackButtonConfig & {
  wrapperClass?: ClassValue
}

export type AuthCardConfig = {
  class?: ClassValue
  ui?: Record<string, string>
  variant?: 'solid' | 'outline' | 'soft' | 'subtle'
}

/**
 * Site chrome around an auth page: none (the page alone), header (the site
 * header), or full (the site header and footer).
 */
export type AuthChrome = 'none' | 'header' | 'full'

export type AuthPageConfig = {
  chrome?: AuthChrome
  backgroundClass?: ClassValue
  backgroundImage?: string
  layout?: 'card' | 'page-split' | 'card-split'
  imagePosition?: 'left' | 'right'
  showBackgroundDecoration?: boolean
  showIcon?: boolean
  backButton?: AuthBackButtonConfig
  card?: AuthCardConfig
  secondaryAction?: AuthSecondaryActionConfig
} & LooseRecord

export type AuthThemeConfig = AuthPageConfig & {
  submitButton?: AuthButtonConfig
  /** Shows the site's AppLogo above the form, linking home. */
  showLogo?: boolean
  /** Classes for that logo, e.g. its height. */
  logoClass?: ClassValue
  /** Classes for the form and status titles; defaults to the standard size and weight. */
  titleClass?: ClassValue
  /** Class overrides for the form panel, passed through to UAuthForm's ui. */
  formUi?: LooseRecord
  pages?: Partial<Record<AuthPageKey, AuthPageConfig>>
}
