<script setup lang="ts">
defineProps<{
  align?: string
}>()
</script>

<template>
  <div v-if="align" :class="['w-full', align]">
    <slot />
  </div>
  <slot v-else />
</template>
