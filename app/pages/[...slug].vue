<script setup lang="ts">
definePageMeta({
  key: (route) => useResolvedPageRequest(route).key.value,
})
</script>

<template>
  <DrupalPageRoute />
</template>
