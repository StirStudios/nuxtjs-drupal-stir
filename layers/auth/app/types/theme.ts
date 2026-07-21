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

type AuthPageKey =
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

export type AuthPageConfig = {
  backgroundClass?: ClassValue
  backgroundImage?: string
  layout?: 'card' | 'page-split' | 'card-split'
  imagePosition?: 'left' | 'right'
  showBackgroundDecoration?: boolean
  showIcon?: boolean
  backButton?: AuthBackButtonConfig
} & LooseRecord

export type AuthThemeConfig = AuthPageConfig & {
  submitButton?: AuthButtonConfig
  pages?: Partial<Record<AuthPageKey, AuthPageConfig>>
}
