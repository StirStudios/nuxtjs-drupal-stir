<script setup lang="ts">
// Stands in for a paragraph whose component throws while rendering.
throw new Error('Broken paragraph fixture')
</script>

<template>
  <p>Never rendered</p>
</template>
