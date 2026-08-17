<!--
  Stir Image

  An editable image for Canvas media and carousel slots.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'image'
  /**
   * Public image URL.
   * @example https://example.com/image.jpg
   */
  src?: string
  alt?: string
  title?: string
  loading?: 'eager' | 'lazy'
}>(), {
  alt: '',
  loading: 'lazy',
  src: '',
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
