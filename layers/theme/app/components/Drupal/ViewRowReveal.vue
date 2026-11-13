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

// Rows that come in after the View is on screen (a filter, sort, page or a
// site's own row filter) take the place of what was there, or of the
// skeleton, at once instead of mounting hidden and fading in.
const showsAtOnce = rowReveal?.isShown() ?? false
</script>

<template>
  <RevealMotion
    v-if="rowReveal"
    :as="as"
    v-bind="showsAtOnce ? { initial: false } : rowReveal.getRowMotionProps(props.index)"
  >
    <slot />
  </RevealMotion>
  <component :is="as" v-else>
    <slot />
  </component>
</template>
