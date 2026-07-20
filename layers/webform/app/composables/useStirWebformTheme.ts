type StirWebformTheme = {
  showToasts?: boolean
  scrollToTopOnSuccess?: boolean
  scrollToTopOnReset?: boolean
  scrollToTopDelayMs?: number
  scrollToTopFallbackDelayMs?: number
  spacing?: string
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
  floatingControlClass: string[]
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
    floatingControlClass: ['peer', 'pt-4!', 'pb-2.5!'],
    labels: {
      floating: webform.labels?.floating ?? forms.floatingLabels,
      ...webform.labels,
      floatingClass: [
        fieldVariant === 'material'
          ? '-top-2 start-0 peer-placeholder-shown:top-3 peer-focus:-top-2'
          : 'top-0 start-1.5 -translate-y-1/2 rounded-sm bg-default px-1.5 peer-placeholder-shown:top-1/2 peer-placeholder-shown:start-2.5 peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0 peer-focus:top-0 peer-focus:start-1.5 peer-focus:bg-default peer-focus:px-1.5',
        ...(Array.isArray(labelBase) ? labelBase : [labelBase ?? '']),
      ].filter(Boolean),
    },
  }
}
