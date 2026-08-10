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
  compactControlClass: string[]
  floatingControlClass: string[]
  labels: NonNullable<StirWebformTheme['labels']> & {
    floatingClass: string[]
    staticFloatingClass: string[]
  }
}

const defaultLabelBase = [
  'text-default pointer-events-none absolute z-10 text-sm font-medium transition-all duration-150 ease-out',
  'peer-placeholder-shown:text-dimmed peer-placeholder-shown:text-base peer-placeholder-shown:font-normal',
  'peer-focus:text-primary peer-focus:text-sm peer-focus:font-medium',
]

export function useStirWebformTheme(): ResolvedStirWebformTheme {
  const stirTheme = useAppConfig().stirTheme as { webform?: StirWebformTheme }
  const forms = useStirFormTheme()
  const webform = stirTheme.webform ?? {}
  const fieldVariant = webform.fieldVariant ?? forms.variant
  const isMaterial = fieldVariant === 'material'
  const labelBase = webform.labels?.base
  const resolvedLabelBase = Array.isArray(labelBase)
    ? labelBase
    : [labelBase ?? '']

  return {
    ...webform,
    fieldVariant,
    compactControlClass: [
      'min-h-12.5',
      isMaterial ? 'px-0!' : 'px-4!',
    ],
    floatingControlClass: [
      'peer',
      isMaterial ? 'px-0!' : 'px-4!',
      'pt-4!',
      'pb-2.5!',
    ],
    labels: {
      floating: webform.labels?.floating ?? forms.floatingLabels,
      ...webform.labels,
      floatingClass: [
        isMaterial
          ? '-top-2 start-0 peer-placeholder-shown:top-3 peer-focus:-top-2'
          : 'top-0 start-2.5 -translate-y-1/2 rounded-sm bg-default px-1.5 peer-placeholder-shown:top-1/2 peer-placeholder-shown:start-4 peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0 peer-focus:top-0 peer-focus:start-2.5 peer-focus:bg-default peer-focus:px-1.5',
        ...defaultLabelBase,
        ...resolvedLabelBase,
      ].filter(Boolean),
      staticFloatingClass: [
        isMaterial
          ? '-top-[11px] start-0'
          : 'top-0 start-2.5 -translate-y-1/2 rounded-sm bg-default px-1.5',
        ...defaultLabelBase,
        ...resolvedLabelBase,
      ].filter(Boolean),
    },
  }
}
