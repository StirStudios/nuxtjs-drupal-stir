<script lang="ts" setup>
// Marks every page of a non-production build, so a local or development site
// is never mistaken for the live one. The same thin red strip as stir_env's
// Drupal admin bar, but held at the bottom of the screen: the top already
// belongs to the editorial tabs and sticky headers. Sticky rather than fixed,
// so at the end of the page it sits below the footer instead of over it.
const environment = String(useRuntimeConfig().public.environment)
const label = `${environment.charAt(0).toUpperCase()}${environment.slice(1)} site`
</script>

<template>
  <aside
    v-if="environment !== 'production'"
    aria-label="Site environment"
    class="sticky bottom-0 z-80 bg-red-700 px-4 py-1 text-center text-sm leading-snug text-white"
  >
    <strong class="font-semibold">{{ label }}</strong>, not production.
  </aside>
</template>
