<script setup lang="ts">
const props = defineProps<{
  mediaEmbed?: string
  url?: string
  title?: string
}>()

const trustedMediaEmbed = computed(() => trustedDrupalHtml(props.mediaEmbed))
</script>

<template>
  <div v-if="trustedMediaEmbed" v-html="trustedMediaEmbed" />

  <audio v-else-if="url" class="w-full" controls>
    <source :src="url" />
    Your browser does not support the audio element.
  </audio>
</template>
