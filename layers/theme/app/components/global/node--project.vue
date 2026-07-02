<script setup lang="ts">
import type { NodeDefaultProps } from '~/composables/useNodeDefaultState'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<NodeDefaultProps>()

defineSlots<{
  hero?(): unknown
  section?(): unknown
}>()
</script>

<template>
  <NodeDefaultBase v-bind="props">
    <template #hero>
      <slot name="hero" />
    </template>

    <template #section>
      <slot name="section" />
    </template>
  </NodeDefaultBase>
</template>
