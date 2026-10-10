<script lang="ts" setup>
// Marks every page of a non-production build, so a local or development site
// is never mistaken for the live one. Matches the Drupal admin bar from
// stir_env: a thin red strip above the header that scrolls with the page.
const environment = String(useRuntimeConfig().public.environment)
const label = `${environment.charAt(0).toUpperCase()}${environment.slice(1)} site`
</script>

<template>
  <div
    v-if="environment !== 'production'"
    class="bg-red-700 px-4 py-1 text-center text-sm leading-snug text-white"
  >
    <strong class="font-semibold">{{ label }}</strong>, not production.
  </div>
</template>
