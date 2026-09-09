<script setup lang="ts">
defineProps<{ corner?: boolean }>()
</script>

<template>
  <span
    aria-hidden="true"
    class="pointer-events-none z-20 flex items-center justify-center text-white transition-transform group-hover:scale-105 group-focus-visible:scale-105"
    :class="corner ? 'absolute end-5 bottom-5 size-6' : 'col-start-1 row-start-1 size-16 rounded-full bg-black/80 shadow-lg'"
  >
    <UIcon :class="corner ? 'size-6' : 'size-9 translate-x-px'" name="i-lucide-play" />
  </span>
</template>
