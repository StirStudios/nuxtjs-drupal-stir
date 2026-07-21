<script setup lang="ts">
withDefaults(defineProps<{
  as?: string
  interactive?: boolean
}>(), {
  as: 'article',
  interactive: true,
})
</script>

<template>
  <component
    :is="as"
    class="group/content-card relative flex h-full flex-col overflow-hidden rounded-lg bg-default ring ring-default transition"
    :class="interactive && 'hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/30 focus-within:ring-primary/40'"
  >
    <slot />
  </component>
</template>
