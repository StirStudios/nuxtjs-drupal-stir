<script setup lang="ts">
const { navigation } = useAppConfig().stirTheme
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader :mode="navigation.mode" />

    <UMain id="main-content" class="flex-1" role="main">
      <SiteMessages />
      <slot />
    </UMain>

    <LazyAppFooter hydrate-on-visible />
  </div>
</template>
