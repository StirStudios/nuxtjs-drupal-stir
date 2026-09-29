<script setup lang="ts">
import type { NuxtError } from '#app'

const stirTheme = useAppConfig()?.stirTheme ?? {}
const errorConfig = stirTheme.error
const route = useRoute()

const props = defineProps<{ error: NuxtError }>()

const statusCode = computed(() => props.error?.statusCode ?? 500)
// Drupal answers 503 while its Maintenance mode is on, so a 503 is planned
// downtime; 502 and 504 are the backend failing.
const isMaintenance = computed(() => statusCode.value === 503)
const isBackendError = computed(() => [502, 504].includes(statusCode.value))
const maintenance = errorConfig?.maintenance ?? {}
const drupalMaintenanceMessage = computed(() => {
  const data = props.error?.data as { maintenanceMessage?: unknown } | undefined

  return typeof data?.maintenanceMessage === 'string' ? data.maintenanceMessage : ''
})

if (import.meta.server && isMaintenance.value) {
  useResponseHeader('Retry-After').value = String(maintenance.retryAfter ?? 300)
}

const displayError = computed<NuxtError>(() => {
  if (isMaintenance.value) {
    return {
      ...props.error,
      statusMessage: maintenance.title || 'Back shortly',
      // Drupal's own maintenance message leads; the config is the fallback.
      message: drupalMaintenanceMessage.value
        || maintenance.message
        || 'We are making some improvements. Please check back in a few minutes.',
    }
  }
  if (!isBackendError.value) return props.error

  return {
    ...props.error,
    statusMessage: 'Content service unavailable',
    message: 'We cannot reach the CMS right now. Please try again later.',
  }
})
const statusMessage = computed(() => {
  if (statusCode.value === 404) return 'Page not found'
  return displayError.value?.statusMessage || 'Something went wrong'
})
const message = computed(() => {
  if (statusCode.value === 404) {
    return 'The page you are looking for does not exist.'
  }

  return displayError.value?.message || 'Please try again.'
})
const renderedError = computed<NuxtError>(() => ({
  ...displayError.value,
  statusMessage: statusMessage.value,
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
