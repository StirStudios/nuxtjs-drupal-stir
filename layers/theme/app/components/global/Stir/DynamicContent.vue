<!--
  Stir Dynamic Content

  A Drupal-rendered dynamic region for Views, listings, and blocks.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
defineProps<{
  heading?: string
}>()

defineSlots<{
  content?(): unknown
}>()
</script>

<template>
  <section>
    <h2 v-if="heading">{{ heading }}</h2>
    <slot name="content" />
  </section>
</template>
