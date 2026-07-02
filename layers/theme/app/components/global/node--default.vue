<script setup lang="ts">
import type { NodeDefaultProps } from '~/types'

const props = defineProps<NodeDefaultProps>()
const attrs = useAttrs()
const nodeProps = computed(() => ({
  ...props,
  ...attrs,
}))

defineOptions({
  inheritAttrs: false,
})

defineSlots<{
  hero?(): unknown
  section?(): unknown
}>()
</script>

<template>
  <DrupalNodeDisplay v-bind="nodeProps">
    <template #hero>
      <slot name="hero" />
    </template>

    <template #section>
      <slot name="section" />
    </template>
  </DrupalNodeDisplay>
</template>
