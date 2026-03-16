<script setup lang="ts">
defineProps<{
  type?: string
  mid?: string | number
  title?: string
  url?: string
}>()
</script>

<template>
  <StirPdfViewer v-if="url" :src="url" />
</template>
