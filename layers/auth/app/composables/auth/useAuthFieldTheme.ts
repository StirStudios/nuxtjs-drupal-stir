import type { UiFieldVariant } from '../../../../foundation/app/utils/nuxtUiProps'

export type AuthFieldTheme = {
  class: string
  variant: UiFieldVariant
}

// Same precedence as the webform layer, so auth and account fields match the
// site's form controls.
export function useAuthFieldTheme(): AuthFieldTheme {
  const forms = useStirFormTheme()
  const webform = (useAppConfig().stirTheme as {
    webform?: { fieldInput?: string, fieldVariant?: unknown }
  } | undefined)?.webform

  return {
    class: webform?.fieldInput || 'w-full',
    variant: resolveUiFieldVariant(webform?.fieldVariant ?? forms.variant),
  }
}
