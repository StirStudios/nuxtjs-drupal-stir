<script setup lang="ts">
import { domAnimation, LazyMotion, m } from 'motion-v'

defineOptions({ inheritAttrs: false })

const MotionElement = m.div
</script>

<template>
  <LazyMotion :features="domAnimation" strict>
    <MotionElement v-bind="$attrs">
      <slot />
    </MotionElement>
  </LazyMotion>
</template>
