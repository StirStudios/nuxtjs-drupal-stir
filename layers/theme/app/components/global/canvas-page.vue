<script setup lang="ts">
defineSlots<{
  components?(): unknown
  default?(): unknown
}>()
</script>

<template>
  <slot name="components">
    <slot />
  </slot>
</template>
