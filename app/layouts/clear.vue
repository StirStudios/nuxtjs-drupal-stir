<script setup lang="ts">
const { isAdministrator } = usePageContext()
</script>

<template>
  <LazyDrupalTabs v-if="isAdministrator" />
  <UMain id="main-content" as="main" role="main">
    <slot />
  </UMain>
</template>
