<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  items: NavigationMenuItem[]
  linkClass?: string
  listClass?: string
}>()
</script>

<template>
  <LazyUNavigationMenu
    aria-label="Mobile Navigation"
    class="app-nav app-nav-mobile"
    :items="items"
    orientation="vertical"
    :ui="{
      link: linkClass,
      list: listClass,
    }"
  />
</template>
