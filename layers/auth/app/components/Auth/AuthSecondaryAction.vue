<script setup lang="ts">
import type { AuthThemeConfig } from '../../types/theme'
import { resolveAuthPageKey } from '../../utils/authTheme'
import { resolveUiButtonVariant, resolveUiColor } from '../../utils/nuxtUiProps'

const {
  label = 'Back to login',
  to = '/auth/login',
} = defineProps<{
  label?: string
  to?: string
}>()

const route = useRoute()
const appConfig = useAppConfig()
const authTheme = computed<AuthThemeConfig>(() =>
  ((appConfig.stirTheme || {}) as { auth?: AuthThemeConfig }).auth || {},
)
const pageKey = computed(() => resolveAuthPageKey(route))
const config = computed(() => ({
  ...authTheme.value.secondaryAction,
  ...(pageKey.value ? authTheme.value.pages?.[pageKey.value]?.secondaryAction : {}),
}))
</script>

<template>
  <div v-if="config.enabled !== false" :class="config.wrapperClass || 'mb-4 flex'">
    <UButton
      :class="config.class"
      :color="resolveUiColor(config.color, 'primary')"
      :icon="config.icon"
      :label="config.label || label"
      :to="config.to || to"
      :variant="resolveUiButtonVariant(config.variant, 'link')"
    />
  </div>
</template>
