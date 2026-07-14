<script lang="ts">
import { domAnimation, LazyMotion, m } from 'motion-v'
import { defineComponent, h } from 'vue'
import type { Component } from 'vue'

const MotionElement = m.div as Component

export default defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(
      LazyMotion,
      { features: domAnimation, strict: true },
      {
        default: () => h(MotionElement, attrs, slots),
      },
    )
  },
})
</script>
