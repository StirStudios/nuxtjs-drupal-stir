<!--
  Stir Image

  An editable image for Canvas media and carousel slots.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'image'
  src: string
  alt?: string
  title?: string
  loading?: 'eager' | 'lazy'
}>(), {
  alt: '',
  loading: 'lazy',
  title: undefined,
  type: 'image',
})
</script>

<template>
  <img
    :alt="alt"
    class="block h-auto max-w-full"
    :loading="loading"
    :src="src"
    :title="title"
  >
</template>
