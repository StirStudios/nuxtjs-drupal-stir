<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: string | number
  uuid?: string
  entityType?: string
  type?: string
  bundle?: string
  label?: string
  url?: string
}>()
</script>

<template>
  <EntityReference v-bind="{ ...props, ...$attrs }">
    <template v-if="$slots.default" #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </EntityReference>
</template>
