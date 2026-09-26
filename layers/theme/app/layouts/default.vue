<script setup lang="ts">
// Auth pages pass footer: false for header-only chrome.
withDefaults(defineProps<{ footer?: boolean }>(), { footer: true })

const { routeHero } = useAppConfig().stirTheme
const normalizedNavigationMode = useHeaderMode()

// Pages rendered in this layout, such as auth pages, size themselves to it.
provide('stirHeaderMode', normalizedNavigationMode)
</script>

<template>
  <div class="flex min-h-dvh flex-col overflow-x-clip">
    <AppHeader :mode="normalizedNavigationMode" />

    <UMain id="main-content" class="flex-1" role="main" tabindex="-1">
      <SiteMessages />
      <LazyRouteHero v-if="routeHero.enabled" />
      <slot />
    </UMain>

    <LazyAppFooter v-if="footer" hydrate-on-visible />
  </div>
</template>
