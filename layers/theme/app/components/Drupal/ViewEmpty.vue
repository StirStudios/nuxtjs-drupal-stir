<script setup lang="ts">
/**
 * What a listing shows when nothing matches: the View's own "No results",
 * or a site's filter of its rows ("No classes on this day"). One look for
 * every empty listing.
 */
const props = withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: string
}>(), {
  title: 'No results found',
  description: undefined,
  icon: 'i-lucide-search-x',
})

defineSlots<{
  description?(): unknown
  actions?(): unknown
}>()
</script>

<template>
  <UEmpty
    :description="props.description"
    :icon="props.icon"
    :title="props.title"
    :ui="{ title: 'text-highlighted text-pretty font-medium mb-0' }"
    variant="subtle"
  >
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </UEmpty>
</template>
