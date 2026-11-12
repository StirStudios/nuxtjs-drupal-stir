<script setup lang="ts">
import type { Component } from 'vue'
import { drupalViewRowRevealKey } from '#stir/utils/drupalViewContext'

const props = withDefaults(defineProps<{
  index: number
  as?: string | Component
}>(), {
  as: 'div',
})

const rowReveal = inject(drupalViewRowRevealKey, undefined)

rowReveal?.register()
</script>

<template>
  <RevealMotion
    v-if="rowReveal"
    :as="as"
    v-bind="rowReveal.getRowMotionProps(props.index)"
  >
    <slot />
  </RevealMotion>
  <component :is="as" v-else>
    <slot />
  </component>
</template>
