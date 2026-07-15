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

const slots = useSlots()
const slotNames = computed(() => Object.keys(slots))
</script>

<template>
  <template v-for="slotName in slotNames" :key="slotName">
    <slot :name="slotName" />
  </template>
</template>
