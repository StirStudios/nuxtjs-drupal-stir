<script setup lang="ts">
import { resolveComponent } from 'vue'

const props = withDefaults(defineProps<{
  card?: boolean
  heading?: string
  subheading?: string
}>(), {
  card: true,
  heading: undefined,
  subheading: undefined,
})

const slots = useSlots()
const sectionComponent = computed(() => props.card ? resolveComponent('UCard') : 'div')
</script>

<template>
  <component :is="sectionComponent">
    <div class="space-y-6">
      <div v-if="heading || subheading || slots.description">
        <h2 v-if="heading" class="text-highlighted mb-1 text-xl font-semibold">
          {{ heading }}
        </h2>
        <p v-if="subheading" class="text-muted text-sm">
          {{ subheading }}
        </p>
        <div v-else-if="slots.description" class="text-muted text-sm">
          <slot name="description" />
        </div>
      </div>

      <slot />
    </div>
  </component>
</template>
