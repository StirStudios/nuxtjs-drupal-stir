<script setup lang="ts">
const { navigation } = useAppConfig().stirTheme

const normalizedNavigationMode = computed(() =>
  navigation?.mode === 'static' ? 'static' : 'fixed',
)
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader :mode="normalizedNavigationMode" />

    <UMain id="main-content" class="flex-1" role="main">
      <SiteMessages />
      <slot />
    </UMain>

    <LazyAppFooter hydrate-on-visible />
  </div>
</template>
