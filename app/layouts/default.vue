<script setup lang="ts">
const { navigation } = useAppConfig().stirTheme
</script>

<template>
  <div class="min-h-dvh flex flex-col">
    <LazyAppHeader :mode="navigation.mode" />

    <UMain id="main-content" class="flex-1" role="main">
      <LazySiteMessages />
      <slot />
    </UMain>

    <LazyAppFooter />
  </div>
</template>
