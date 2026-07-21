<script setup lang="ts">
defineProps<{
  url: string
  label: string
  external?: boolean
}>()
</script>

<template>
  <NuxtLink
    :data-external="external || undefined"
    :external="external"
    :to="url"
  >
    <slot>{{ label }}</slot>
  </NuxtLink>
</template>
