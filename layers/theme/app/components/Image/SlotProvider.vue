<script setup lang="ts">
import type { ImageSlot } from '#stir/utils/imageDelivery'
import { imageSlotKey } from '#stir/utils/imageDelivery'

// Provides the image slot for its content without adding markup, for
// templates that place content in cells of different widths.
const props = defineProps<{ imageSlot: ImageSlot }>()

provide(imageSlotKey, computed(() => props.imageSlot))
</script>

<template>
  <slot />
</template>
