<script setup lang="ts">
import type { Component } from 'vue'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'

const props = withDefaults(defineProps<{
  as?: string | Component
  motionProps?: Record<string, unknown>
  effect?: string
  delayMs?: number
  durationMs?: number
  distancePx?: number
  rootMargin?: string
}>(), {
  as: 'div',
  motionProps: undefined,
  effect: undefined,
  delayMs: 0,
  durationMs: undefined,
  distancePx: undefined,
  rootMargin: undefined,
})

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()
// Resolve shorthand motion only for callers that use it, so paragraphs that
// already pass resolved motionProps do not set up a second motion config.
const effectMotionProps = props.effect && !props.motionProps
  ? useRevealMotionConfig().useRevealMotionProps(
      () => props.effect,
      () => props.delayMs,
      () => ({
        durationMs: props.durationMs,
        distancePx: props.distancePx,
        rootMargin: props.rootMargin,
      }),
    )
  : undefined
const resolvedMotionProps = computed(() => props.motionProps ?? effectMotionProps?.value ?? {})
const hasRevealMotion = computed(() => 'whileInView' in resolvedMotionProps.value)
</script>

<template>
  <LazyRevealMotion
    v-if="hasRevealMotion"
    as-child
    v-bind="resolvedMotionProps"
  >
    <component :is="as" v-bind="attrs">
      <slot />
    </component>
  </LazyRevealMotion>
  <component :is="as" v-else v-bind="attrs">
    <slot />
  </component>
</template>
