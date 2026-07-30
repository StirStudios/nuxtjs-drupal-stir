<script setup lang="ts">
import type { Component } from 'vue'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import { useRevealMotionScope } from '#stir/composables/useRevealMotionScope'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  id?: number | string
  direction?: string
  as?: string | Component
}>(), {
  as: 'div',
  direction: undefined,
  id: undefined,
})

const attrs = useAttrs()
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
    :key="`paragraph-${id ?? 'unknown'}-${revealMotionKey}`"
    :as="as"
    :motion-props="motionProps"
    v-bind="attrs"
  >
    <slot />
  </RevealMotionElement>
</template>
