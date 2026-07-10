import type { AuthUiConfig } from '../../types/auth'

export function useAuthConfig() {
  const appConfig = useAppConfig()
  const integrationEnabled = appConfig.authIntegration?.drupalAccounts === true
  const { data: drupalAuth, status, execute } = useAsyncData(
    'stir-auth-ui-config',
    async () => integrationEnabled
      ? await $fetch<Partial<AuthUiConfig>>('/api/auth/config')
      : {},
    {
      default: () => ({}),
      dedupe: 'defer',
    },
  )
  const auth = computed<Partial<AuthUiConfig>>(() => drupalAuth.value || {})

  const ensureLoaded = async () => {
    if (!integrationEnabled || status.value === 'success') return

    await execute({ dedupe: 'defer' })
  }

  return {
    auth,
    integrationEnabled,
    status,
    ensureLoaded,
  }
}
