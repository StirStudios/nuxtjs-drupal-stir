type StirWebformTheme = {
  showToasts?: boolean
  scrollToTopOnSuccess?: boolean
  scrollToTopOnReset?: boolean
  scrollToTopDelayMs?: number
  scrollToTopFallbackDelayMs?: number
  spacing?: string
  spacingLarge?: string
  formClass?: string
  labels?: {
    floating?: boolean
    base?: string | string[]
  }
  fieldGroupHeader?: string
  fieldGroup?: string
  fieldInput?: string
  fieldText?: string
  response?: string
  description?: string
  help?: string
  submitAlign?: string
  submitComponent?: string
  buttonClass?: string
  submitButtonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  fieldVariant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none' | 'material'
}

type ResolvedStirWebformTheme = StirWebformTheme & {
  labels: NonNullable<StirWebformTheme['labels']>
}

export function useStirWebformTheme(): ResolvedStirWebformTheme {
  const stirTheme = useAppConfig().stirTheme as { webform?: StirWebformTheme }
  const webform = stirTheme.webform ?? {}

  return {
    ...webform,
    labels: webform.labels ?? {},
  }
}
