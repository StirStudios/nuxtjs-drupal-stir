<script setup lang="ts">
const appConfig = useAppConfig()
const popupEnabled = computed(() => appConfig.popup?.enabled === true)
const privacyNoticeEnabled = computed(
  () => appConfig.privacyNotice?.enabled === true,
)
</script>

<template>
  <LazyAppPopup v-if="popupEnabled" />
  <LazyPrivacyNotice v-if="privacyNoticeEnabled" />
</template>
