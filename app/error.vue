<script setup lang="ts">
import type { NuxtError } from '#app'

const { navigation, error: errorConfig } = useAppConfig().stirTheme
const { isAdministrator } = usePageContext()

defineProps<{ error: NuxtError }>()

const clearAction = computed(() => ({
  label: errorConfig?.label || 'Take me back home',
  color: errorConfig?.color || 'primary',
  variant: errorConfig?.variant || 'solid',
}))
</script>

<template>
  <LazyRegionArea area="top" />
  <LazyDrupalTabs v-if="isAdministrator" />
  <LazyAppHeader :mode="navigation.mode" />

  <UMain id="main-content" as="main" role="main">
    <UError
      :clear="clearAction"
      :error="error"
      redirect="/"
      :ui="{
        links: 'mt-2',
        statusMessage: 'leading-tight',
      }"
    />
  </UMain>

  <LazyRegionArea area="sub_footer" />
  <LazyAppFooter />
</template>
