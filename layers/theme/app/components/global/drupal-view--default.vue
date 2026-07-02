<script setup lang="ts">
import type { DrupalViewProps } from '~/types'

const props = defineProps<DrupalViewProps>()
const attrs = useAttrs()
const viewProps = computed(() => ({
  ...props,
  ...attrs,
}))

defineSlots<{
  rows?(): unknown
}>()
</script>

<template>
  <DrupalViewDisplay v-bind="viewProps">
    <template #rows>
      <slot name="rows" />
    </template>
  </DrupalViewDisplay>
</template>
