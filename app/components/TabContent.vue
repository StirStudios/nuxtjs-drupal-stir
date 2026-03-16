<script setup lang="ts">
defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  editLink?: string
}>()
</script>

<template>
  <EditLink :link="editLink">
    <slot />
  </EditLink>
</template>
