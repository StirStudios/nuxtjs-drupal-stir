<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  title?: string
  header?: string
  headerTag?: string

  editLink?: string
}>()
</script>

<template>
  <slot name="tabContent" />
</template>
