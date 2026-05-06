<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  editLink?: string
  title?: string
  type?: string
  created?: number | string
}>()

defineSlots<{
  paragraphBlock?: () => unknown
}>()
</script>

<template>
  <slot name="paragraphBlock" />
</template>
