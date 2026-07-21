<script setup lang="ts">
const props = defineProps<{
  value: string | number | boolean
  valueType?: 'string' | 'integer' | 'number' | 'boolean'
}>()

defineSlots<{
  default?(props: {
    value: string | number | boolean
    valueType?: string
  }): unknown
}>()
</script>

<template>
  <span>
    <slot :value="props.value" :value-type="props.valueType">
      {{ props.value }}
    </slot>
  </span>
</template>
