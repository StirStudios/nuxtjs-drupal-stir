<script setup lang="ts">
// Shared UI outside the page reads the current Drupal page, as the header,
// breadcrumbs and region areas do.
const page = useStirDrupalCe().getPage()
</script>

<template>
  <p id="shared-title">{{ page.title || '(empty)' }}</p>
  <NuxtPage />
</template>
