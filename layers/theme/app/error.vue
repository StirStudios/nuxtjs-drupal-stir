<script setup lang="ts">
import type { NuxtError } from '#app'

const stirTheme = useAppConfig()?.stirTheme ?? {}
const errorConfig = stirTheme.error
const route = useRoute()

const props = defineProps<{ error: NuxtError }>()

const { statusCode, isMaintenance, title, message } = useStirErrorPage(() => props.error)
const renderedError = computed<NuxtError>(() => ({
  ...props.error,
  statusCode: statusCode.value,
  statusMessage: title.value,
  message: message.value,
}))

const clearAction = computed(() => ({
  label: errorConfig?.label || 'Back to home',
  color: errorConfig?.color || 'primary',
  size: errorConfig?.size === '2xl' ? 'xl' : errorConfig?.size || 'xl',
  icon: errorConfig?.icon || 'i-lucide-arrow-left',
  variant: errorConfig?.variant || 'solid',
}))

const safeRedirect = computed(() => (route.path === '/' ? undefined : '/'))
</script>

<template>
  <UMain id="main-content" as="main" role="main" tabindex="-1">
    <UError
      :clear="isMaintenance ? false : clearAction"
      :error="renderedError"
      :redirect="safeRedirect"
    />
  </UMain>
</template>
