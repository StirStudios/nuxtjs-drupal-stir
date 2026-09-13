<script lang="ts" setup>
const appConfig = useAppConfig()
const nuxtApp = useNuxtApp()
const scrollButtonEnabled = computed(
  () => appConfig.stirTheme.scrollButton?.enabled !== false,
)
// Project-registered browser-only components, such as a custom cursor or page
// transition. Unknown names render nothing.
const clientComponents = computed(() =>
  (appConfig.stirTheme.clientComponents ?? []).flatMap((name) => {
    const component = nuxtApp.vueApp.component(name)

    return component ? [{ name, component }] : []
  }),
)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator
      :color="appConfig.stirTheme.loadingIndicator || undefined"
    />
    <NuxtRouteAnnouncer />
    <nav aria-label="Skip links">
      <a
        aria-label="Skip to main content"
        class="absolute top-0 left-0 z-50 m-3 -translate-y-96 p-3 transition focus:translate-y-0"
        href="#main-content"
        tabindex="0"
      >
        Skip to main content
      </a>
    </nav>
    <NuxtPage />
    <LazyAppScrollToTop v-if="scrollButtonEnabled" />
    <LazyAppIntegrations />
    <ClientOnly v-if="clientComponents.length">
      <component
        :is="entry.component"
        v-for="entry in clientComponents"
        :key="entry.name"
      />
    </ClientOnly>
  </UApp>
</template>
