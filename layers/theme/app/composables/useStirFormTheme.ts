import type { UiFieldVariantName } from '#stir/types/app-config'

export type StirFormTheme = {
  floatingLabels: boolean
  variant: UiFieldVariantName
}

export function useStirFormTheme(): StirFormTheme {
  const forms = (useAppConfig().stirTheme as {
    forms?: Partial<StirFormTheme>
  }).forms

  return {
    floatingLabels: forms?.floatingLabels ?? false,
    variant: forms?.variant ?? 'outline',
  }
}
