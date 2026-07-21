<script setup lang="ts">
const props = defineProps<{
  value: string | number
  label: string
}>()

defineSlots<{
  default?(props: { value: string | number, label: string }): unknown
}>()
</script>

<template>
  <span>
    <slot :label="props.label" :value="props.value">
      {{ props.label }}
    </slot>
  </span>
</template>
