<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  bodyClass?: string
  items: NavigationMenuItem[]
  linkClass?: string
  listClass?: string
}>()
</script>

<template>
  <div
    :class="bodyClass"
    data-slot="body"
  >
    <LazyUNavigationMenu
      aria-label="Mobile Navigation"
      class="-mx-2.5 app-nav app-nav-mobile"
      :items="items"
      orientation="vertical"
      :ui="{
        link: linkClass,
        list: listClass,
      }"
    />
  </div>
</template>
