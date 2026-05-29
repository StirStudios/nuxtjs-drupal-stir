<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  bodyClass?: string
  items: NavigationMenuItem[]
  linkClass?: string
}>()
</script>

<template>
  <div
    :class="bodyClass"
    data-slot="body"
  >
    <LazyUNavigationMenu
      aria-label="Mobile Navigation"
      class="app-nav app-nav-mobile"
      :items="items"
      orientation="vertical"
      :ui="{ link: linkClass }"
    />
  </div>
</template>
