<script setup lang="ts">
import type { AuthThemeConfig } from '../../types/theme'

const props = withDefaults(defineProps<{
  headerFull?: boolean
}>(), {
  headerFull: false,
})

const route = useRoute()
const appConfig = useAppConfig()
const authTheme = computed<AuthThemeConfig>(() =>
  ((appConfig.stirTheme || {}) as { auth?: AuthThemeConfig }).auth || {},
)
const pageKey = computed(() => {
  const explicitKey = route.meta.authPageKey

  if (typeof explicitKey === 'string' && explicitKey in (authTheme.value.pages || {})) {
    return explicitKey as keyof NonNullable<AuthThemeConfig['pages']>
  }

  const path = route.path

  if (path.endsWith('/auth/password/request')) return 'passwordRequest'
  if (path.endsWith('/auth/password/reset')) return 'passwordReset'
  if (path.endsWith('/auth/register')) return 'register'
  if (path.endsWith('/auth/verify')) return 'verify'
  if (path.endsWith('/auth/logout')) return 'logout'
  if (path.endsWith('/auth/protected')) return 'protectedPage'
  return 'login'
})
const cardConfig = computed(() => ({
  ...authTheme.value.card,
  ...authTheme.value.pages?.[pageKey.value]?.card,
}))
const cardClass = computed(() => cardConfig.value.class || 'w-full shadow-lg')
const cardUi = computed(() => ({
  container: 'p-6 sm:p-6',
  footer: 'text-center text-sm text-muted',
  wrapper: 'w-full',
  ...cardConfig.value.ui,
  ...(props.headerFull ? { header: 'w-full' } : {}),
}))
</script>

<template>
  <UPageCard
    :class="cardClass"
    :ui="cardUi"
    :variant="cardConfig.variant || 'outline'"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UPageCard>
</template>
