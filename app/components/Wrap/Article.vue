<script setup lang="ts">
defineProps<{
  isArticle?: boolean
}>()
</script>

<template>
  <article v-if="isArticle">
    <slot />
  </article>
  <slot v-else />
</template>
