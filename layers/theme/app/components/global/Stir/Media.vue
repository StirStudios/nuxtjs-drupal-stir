<!--
  Stir Media

  A governed media section with an editable media slot.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
defineProps<{
  heading?: string
  align?: 'left' | 'center' | 'right'
  width?: 'narrow' | 'standard' | 'wide' | 'full'
  overlay?: boolean
}>()

defineSlots<{
  media?(): unknown
}>()
</script>

<template>
  <ParagraphMedia
    :align="align"
    :header="heading"
    header-tag="h2"
    :overlay="overlay"
    :width="width"
  >
    <template #media>
      <slot name="media" />
    </template>
  </ParagraphMedia>
</template>
