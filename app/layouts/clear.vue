<script setup lang="ts">
const { isAdministrator } = usePageContext()
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <LazyDrupalTabs v-if="isAdministrator" />
    <UMain id="main-content" as="main" class="flex-1" role="main">
      <slot />
    </UMain>
  </div>
</template>
