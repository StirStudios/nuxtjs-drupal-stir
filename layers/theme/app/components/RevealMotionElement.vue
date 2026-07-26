<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  as?: string | Component
  motionProps?: Record<string, unknown>
}>(), {
  as: 'div',
  motionProps: () => ({}),
})

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()
const hasRevealMotion = computed(() => 'whileInView' in props.motionProps)
</script>

<template>
  <LazyRevealMotion
    v-if="hasRevealMotion"
    as-child
    v-bind="motionProps"
  >
    <component :is="as" v-bind="attrs">
      <slot />
    </component>
  </LazyRevealMotion>
  <component :is="as" v-else v-bind="attrs">
    <slot />
  </component>
</template>
