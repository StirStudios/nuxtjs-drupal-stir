<script setup lang="ts">
import type { NodeDefaultProps } from '#stir/types'

const props = defineProps<NodeDefaultProps>()
const attrs = useAttrs()
const slots = useSlots()
const nodeProps = computed(() => ({
  ...props,
  ...attrs,
}))
const forwardedSlotNames = computed(() => Object.keys(slots))

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <NodeDefault v-bind="nodeProps">
    <template
      v-for="slotName in forwardedSlotNames"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>
  </NodeDefault>
</template>
