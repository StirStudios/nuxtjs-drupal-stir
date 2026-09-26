<script setup lang="ts">
definePageMeta({
  key: (route) => useResolvedPageRequest(route).key.value,
  // Resolved from the Drupal payload by middleware/drupalPageLayout.global.ts.
  drupalPage: true,
})
</script>

<template>
  <DrupalPageRoute />
</template>
