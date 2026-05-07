<script setup lang="ts">
const props = defineProps<{
  addClasses?: string
}>()

const { slotProps } = useAppLogo(props)
</script>

<template>
  <slot v-bind="slotProps"> Add logo markup in AppLogo slot </slot>
</template>
