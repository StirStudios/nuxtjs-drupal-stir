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
  labels: NonNullable<StirWebformTheme['labels']> & {
    floatingClass: string[]
  }
}

export function useStirWebformTheme(): ResolvedStirWebformTheme {
  const stirTheme = useAppConfig().stirTheme as { webform?: StirWebformTheme }
  const forms = useStirFormTheme()
  const webform = stirTheme.webform ?? {}
  const fieldVariant = webform.fieldVariant ?? forms.variant
  const labelBase = webform.labels?.base

  return {
    ...webform,
    fieldVariant,
    labels: {
      floating: webform.labels?.floating ?? forms.floatingLabels,
      ...webform.labels,
      floatingClass: [
        fieldVariant === 'material'
          ? ''
          : 'px-1.5 peer-placeholder-shown:px-0 peer-focus:px-1.5',
        ...(Array.isArray(labelBase) ? labelBase : [labelBase ?? '']),
      ].filter(Boolean),
    },
  }
}
