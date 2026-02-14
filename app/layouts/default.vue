<script setup lang="ts">
const { navigation } = useAppConfig().stirTheme
const { isAdministrator } = usePageContext()
</script>

<template>
  <LazyRegionArea area="top" />
  <LazyDrupalTabs v-if="isAdministrator" />
  <LazyAppHeader :mode="navigation.mode" />

  <UMain id="main-content" as="main" role="main">
    <LazySiteMessages />
    <slot />
  </UMain>

  <LazyRegionArea area="sub_footer" />
  <LazyAppFooter />
</template>
