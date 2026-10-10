<script lang="ts" setup>
// Marks every page of a non-production build, so a local or development site
// is never mistaken for the live one. Bottom left keeps clear of the
// scroll-to-top button.
const environment = String(useRuntimeConfig().public.environment)
const label = `${environment.charAt(0).toUpperCase()}${environment.slice(1)} site`
</script>

<template>
  <div
    v-if="environment !== 'production'"
    class="pointer-events-none fixed bottom-0 left-0 z-50 bg-red-700 px-2 py-0.5 text-xs font-semibold text-white"
  >
    {{ label }}
  </div>
</template>
