<script setup lang="ts">
import { provideRevealMotionScope } from '#stir/composables/useRevealMotionScope'

const props = defineProps<{
  effect?: string
  stagger?: boolean
}>()

provideRevealMotionScope(
  () => props.effect,
  { stagger: () => props.stagger },
)
</script>

<template>
  <slot />
</template>
