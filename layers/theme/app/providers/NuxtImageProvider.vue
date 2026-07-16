<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const definedAttrs = computed(() => Object.fromEntries(
  Object.entries(attrs).filter(([, value]) => value !== undefined),
))
</script>

<template>
  <NuxtImg v-bind="definedAttrs" />
</template>
