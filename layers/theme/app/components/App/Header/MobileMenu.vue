<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { HeaderActionItem } from '#stir/utils/navigation'

defineProps<{
  actions?: HeaderActionItem[]
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

  <div
    v-if="actions?.length"
    class="mt-6 grid gap-3"
    data-slot="actions"
  >
    <UButton
      v-for="action in actions"
      :key="action.item.label"
      block
      :class="['min-h-11', action.button.class]"
      :color="action.button.color"
      :icon="action.button.icon"
      :label="action.item.label"
      size="xl"
      :target="action.item.target"
      :to="action.item.to"
      :variant="action.button.variant"
    />
  </div>
</template>
