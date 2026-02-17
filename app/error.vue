<script setup lang="ts">
import type { NuxtError } from '#app'

const stirTheme = useAppConfig()?.stirTheme ?? {}
const navigation = stirTheme.navigation ?? { mode: 'default' }
const errorConfig = stirTheme.error
const { isAdministrator } = usePageContext()

const props = defineProps<{ error: NuxtError }>()

const isBackendError = computed(() =>
  [502, 503, 504].includes(props.error?.statusCode ?? 0),
)

const displayError = computed<NuxtError>(() => {
  const statusCode = props.error?.statusCode
  if (statusCode !== 502 && statusCode !== 503 && statusCode !== 504) {
    return props.error
  }

  return {
    ...props.error,
    statusMessage: 'Content service unavailable',
    message: 'We cannot reach the CMS right now. Please try again later.',
  }
})

const clearAction = computed(() => ({
  label: errorConfig?.label || 'Back to home',
  color: errorConfig?.color || 'primary',
  size: errorConfig?.size || 'xl',
  icon: errorConfig?.icon || 'i-lucide-arrow-left',
  variant: errorConfig?.variant || 'solid',
}))
</script>

<template>
  <template v-if="!isBackendError">
    <LazyRegionArea area="top" />
    <LazyDrupalTabs v-if="isAdministrator" />
    <LazyAppHeader :mode="navigation.mode" />
  </template>

  <UMain id="main-content" as="main" role="main">
    <UError :clear="clearAction" :error="displayError" redirect="/" />
  </UMain>

  <template v-if="!isBackendError">
    <LazyRegionArea area="sub_footer" />
    <LazyAppFooter />
  </template>
</template>
