<script setup lang="ts">
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import { useRevealMotionScope } from '#stir/composables/useRevealMotionScope'

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
  view?: unknown

  carousel?: boolean
  carouselArrows?: boolean
  carouselAutoheight?: boolean
  carouselAutoscroll?: boolean
  carouselFade?: boolean
  carouselIndicators?: boolean
  carouselInterval?: number
}>()

const { getRevealDelayMs, revealMotionKey, useRevealMotionProps } =
  useRevealMotionConfig()
const { effect, staggerIndex } = useRevealMotionScope(() => props.direction)
const motionProps = useRevealMotionProps(
  effect,
  () => getRevealDelayMs(staggerIndex.value),
)
</script>

<template>
  <RevealMotionElement
    :key="`view-${id}-${revealMotionKey}`"
    as="div"
    :motion-props="motionProps"
  >
    <slot name="content" />
  </RevealMotionElement>
</template>
