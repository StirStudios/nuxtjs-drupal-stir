<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { AuthThemeConfig } from '../../types/theme'
import { resolveAuthPageKey, resolveAuthSecondaryAction } from '../../utils/authTheme'
import { resolveUiButtonVariant, resolveUiColor } from '../../utils/nuxtUiProps'

const {
  label = 'Back to login',
  to = '/auth/login',
} = defineProps<{
  label?: string
  to?: RouteLocationRaw
}>()

const route = useRoute()
const appConfig = useAppConfig()
const authTheme = computed<AuthThemeConfig>(() =>
  ((appConfig.stirTheme || {}) as { auth?: AuthThemeConfig }).auth || {},
)
const pageKey = computed(() => resolveAuthPageKey(route))
const config = computed(() => resolveAuthSecondaryAction(authTheme.value, pageKey.value))
</script>

<template>
  <div v-if="config.enabled !== false" :class="config.wrapperClass || 'flex'">
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
