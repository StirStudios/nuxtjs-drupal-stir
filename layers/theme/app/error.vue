<script setup lang="ts">
import type { NuxtError } from '#app'

const stirTheme = useAppConfig()?.stirTheme ?? {}
const errorConfig = stirTheme.error
const route = useRoute()

const props = defineProps<{ error: NuxtError }>()

const isBackendError = computed(() =>
  [502, 503, 504].includes(props.error?.statusCode ?? 0),
)
const statusCode = computed(() => props.error?.statusCode ?? 500)
const displayError = computed<NuxtError>(() => {
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
  size: errorConfig?.size || 'xl',
  icon: errorConfig?.icon || 'i-lucide-arrow-left',
  variant: errorConfig?.variant || 'solid',
}))

const safeRedirect = computed(() => (route.path === '/' ? undefined : '/'))
</script>

<template>
  <UMain id="main-content" as="main" role="main">
    <UError
      :clear="clearAction"
      :error="renderedError"
      :redirect="safeRedirect"
    />
  </UMain>
</template>
