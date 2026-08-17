<!--
  Stir Image

  An editable image for Canvas media and carousel slots.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'image'
  /** Image selected from Drupal's Media Library. */
  image?: CanvasImage
  title?: string
  loading?: 'eager' | 'lazy'
}>(), {
  image: undefined,
  loading: 'lazy',
  title: undefined,
  type: 'image',
})
</script>

<template>
  <img
    v-if="image?.src"
    :alt="image.alt || ''"
    class="block h-auto max-w-full"
    :height="image.height"
    :loading="loading"
    :src="image.src"
    :title="title"
    :width="image.width"
  >
</template>
