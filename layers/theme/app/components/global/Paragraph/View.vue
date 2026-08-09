<script setup lang="ts">
import { drupalViewQueryNamespaceKey } from '#stir/utils/drupalViewContext'

const props = defineProps<{
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
  queryNamespace?: string
  view?: unknown

  carousel?: boolean
  carouselArrows?: boolean
  carouselAutoheight?: boolean
  carouselAutoscroll?: boolean
  carouselFade?: boolean
  carouselIndicators?: boolean
  carouselInterval?: number
}>()

provide(
  drupalViewQueryNamespaceKey,
  computed(() => props.queryNamespace?.trim() || undefined),
)
</script>

<template>
  <slot name="content" />
</template>
