<script setup lang="ts">
definePageMeta({
  key: (route) => useResolvedPageRequest(route).key.value,
  // Its layout comes from the Drupal payload, set before render by
  // plugins/drupalPageLayout.{server,client}.ts.
  drupalPage: true,
})
</script>

<template>
  <DrupalPageRoute />
</template>
