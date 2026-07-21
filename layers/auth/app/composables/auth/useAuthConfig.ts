import type { AuthUiConfig } from '../../types/auth'

export function useAuthConfig() {
  const { data: drupalAuth, status, execute } = useAsyncData(
    'stir-auth-ui-config',
    async () => await $fetch<Partial<AuthUiConfig>>('/api/auth/config'),
    {
      default: () => ({}),
      dedupe: 'defer',
    },
  )
  const auth = computed<Partial<AuthUiConfig>>(() => drupalAuth.value || {})
  const accountsEnabled = computed(() =>
    typeof auth.value.version === 'number'
    && auth.value.accountsEnabled !== false,
  )

  const ensureLoaded = async () => {
    if (status.value === 'success') return

    await execute({ dedupe: 'defer' })
  }

  return {
    auth,
    accountsEnabled,
    status,
    ensureLoaded,
  }
}
