<script setup lang="ts">
type HeaderMode = 'fixed' | 'sticky'

const route = useRoute()
const { navigation } = useAppConfig().stirTheme

const toHeaderMode = (value: unknown): HeaderMode =>
  value === 'sticky' ? 'sticky' : 'fixed'

const normalizedNavigationMode = computed<HeaderMode>(() =>
  (['fixed', 'sticky'] as const).find((mode) =>
    navigation?.modeRoutes?.[mode]?.some((pattern) =>
      matchesRoutePattern(route.path, pattern),
    ),
  ) ?? toHeaderMode(navigation?.mode),
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
