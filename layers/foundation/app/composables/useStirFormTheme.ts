import type { UiFieldVariantName } from '../types/ui'

export type StirFormTheme = {
  floatingLabels: boolean
  variant: UiFieldVariantName
}

export function useStirFormTheme(): StirFormTheme {
  const forms = (useAppConfig().stirTheme as {
    forms?: Partial<StirFormTheme>
  } | undefined)?.forms

  return {
    floatingLabels: forms?.floatingLabels ?? false,
    variant: forms?.variant ?? 'outline',
  }
}
