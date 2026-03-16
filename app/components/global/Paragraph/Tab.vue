<script setup lang="ts">
defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  title?: string

  editLink?: string
}>()
</script>

<template>
  <EditLink :link="editLink">
    <slot name="tabContent" />
  </EditLink>
</template>
