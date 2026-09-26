<script lang="ts" setup>
const appConfig = useAppConfig()
const nuxtApp = useNuxtApp()
// Embedded in another site (for example Piper's calculator widget), the app
// renders only its page: the host page owns the skip link, announcements,
// loading bar and page-level extras.
const embedded = computed(() => appConfig.stirTheme.embedded === true)
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
    <template v-if="!embedded">
      <NuxtLoadingIndicator
        :color="appConfig.stirTheme.loadingIndicator || undefined"
      />
      <NuxtRouteAnnouncer />
    </template>
    <nav v-if="!embedded" aria-label="Skip links">
      <a
        aria-label="Skip to main content"
        class="fixed top-0 left-0 z-50 m-3 -translate-y-96 rounded-md bg-default px-4 py-3 text-sm font-semibold text-highlighted shadow-lg ring-2 ring-primary transition focus:translate-y-0 focus-visible:outline-none"
        href="#main-content"
        tabindex="0"
      >
        Skip to main content
      </a>
    </nav>
    <!-- One layout instance persists across pages that share it, so the
         header and footer aren't rebuilt on every navigation. -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <template v-if="!embedded">
      <LazyAppScrollToTop v-if="scrollButtonEnabled" />
      <LazyAppIntegrations />
      <ClientOnly v-if="clientComponents.length">
        <component
          :is="entry.component"
          v-for="entry in clientComponents"
          :key="entry.name"
        />
      </ClientOnly>
    </template>
  </UApp>
</template>
