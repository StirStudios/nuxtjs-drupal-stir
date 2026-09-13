<script setup lang="ts">
// Renders the trusted, image-optimized HTML of EditableRichText. Projects
// override this component to expand their own inline embeds. Keep a single
// root element: reveal motion binds to it.
defineProps<{
  html: string
}>()
</script>

<template>
  <div v-html="html" />
</template>
