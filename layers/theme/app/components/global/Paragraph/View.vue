<script setup lang="ts">
defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  header?: string
  gridItems?: string
  randomize?: boolean | string
  width?: string
  spacing?: string
  editLink?: string
  direction?: string

  viewId?: string
  displayId?: string
  paragraphId?: number | string
  paragraphUuid?: string
  view?: unknown

  carousel?: boolean
  carouselArrows?: boolean
  carouselAutoheight?: boolean
  carouselAutoscroll?: boolean
  carouselFade?: boolean
  carouselIndicators?: boolean
  carouselInterval?: number
}>()
</script>

<template>
  <slot name="content" />
</template>
