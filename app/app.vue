<script lang="ts" setup>
const appConfig = useAppConfig()
const popupEnabled = computed(() => appConfig.popup?.enabled === true)
const cookieConsentEnabled = computed(
  () => appConfig.cookieConsent?.enabled === true,
)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator
      :color="appConfig.stirTheme.loadingIndicator || undefined"
    />
    <a
      aria-label="Skip to main content"
      class="absolute top-0 left-0 z-50 m-3 -translate-y-96 p-3 transition focus:translate-y-0"
      href="#main-content"
      tabindex="0"
    >
      Skip to main content
    </a>
    <NuxtPage />
    <LazyAppScrollToTop />
    <LazyAppPopup v-if="popupEnabled" />
    <LazyCookieConsent v-if="cookieConsentEnabled" />
  </UApp>
</template>
