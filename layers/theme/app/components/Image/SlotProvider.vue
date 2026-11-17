<script setup lang="ts">
import type { ImageSlot } from '#stir/utils/imageDelivery'
import { imageBoxAspectKey, imageSlotKey } from '#stir/utils/imageDelivery'

// Provides the image slot for its content without adding markup, for
// templates that place content in cells of different widths. boxAspect
// (width / height) is the shape of a fixed-aspect box the content crops its
// images to, such as a square avatar.
const props = defineProps<{ imageSlot?: ImageSlot, boxAspect?: number }>()

if (props.imageSlot) provide(imageSlotKey, computed(() => props.imageSlot!))
if (props.boxAspect) provide(imageBoxAspectKey, computed(() => props.boxAspect))
</script>

<template>
  <slot />
</template>
