<script setup lang="ts">
defineProps<{ text?: string }>()
</script>

<template>
  <p
    v-if="text?.trim()"
    class="eyebrow mt-0 mb-[var(--stir-eyebrow-gap,0.75rem)] text-sm font-semibold tracking-[0.1em] uppercase"
  >
    {{ text }}
  </p>
</template>
