<script setup lang="ts">
defineProps<{
  mediaEmbed?: string
  url?: string
  title?: string
}>()
</script>

<template>
  <div v-if="mediaEmbed" v-html="mediaEmbed" />

  <audio v-else-if="url" class="w-full" controls>
    <source :src="url" />
    Your browser does not support the audio element.
  </audio>
</template>
