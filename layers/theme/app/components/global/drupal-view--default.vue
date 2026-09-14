<script setup lang="ts">
import type { DrupalViewControlsSlotProps, DrupalViewProps } from '#stir/types'

const props = defineProps<DrupalViewProps>()
const attrs = useAttrs()
const viewProps = computed(() => ({
  ...props,
  ...attrs,
}))

defineSlots<{
  rows?(): unknown
  controls?(props: DrupalViewControlsSlotProps): unknown
}>()
</script>

<template>
  <DrupalViewDisplay v-bind="viewProps">
    <template #rows>
      <slot name="rows" />
    </template>
    <template v-if="$slots.controls" #controls="controls">
      <slot name="controls" v-bind="controls" />
    </template>
  </DrupalViewDisplay>
</template>
