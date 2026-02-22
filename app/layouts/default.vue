<script setup lang="ts">
const { navigation } = useAppConfig().stirTheme
</script>

<template>
  <div class="grid min-h-dvh grid-rows-[auto_1fr_auto]">
    <LazyAppHeader :mode="navigation.mode" />

    <UMain id="main-content" role="main">
      <LazySiteMessages />
      <slot />
    </UMain>

    <LazyAppFooter />
  </div>
</template>
