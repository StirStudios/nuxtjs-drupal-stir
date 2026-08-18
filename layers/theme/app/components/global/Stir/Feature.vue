<!--
  Stir Feature

  A governed feature card with an optional action.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
const props = defineProps<{
  heading?: string
  /**
   * Feature copy
   * @contentMediaType text/html
   * @formattingContext block
   */
  text?: string
  iconName?: string
  linkLabel?: string
  /**
   * Link destination
   * @format uri-reference
   */
  linkUrl?: string
  cardVariant?: 'outline' | 'soft' | 'solid' | 'subtle'
  animation?: 'none' | 'fade' | 'fade-up' | 'fade-down'
}>()

const link = computed(() => props.linkUrl
  ? {
      linkTitle: props.linkLabel || props.linkUrl,
      linkUrl: props.linkUrl,
    }
  : undefined)
</script>

<template>
  <ParagraphFeature
    :card-variant="cardVariant"
    :direction="animation === 'none' ? undefined : animation"
    :header="heading"
    header-tag="h3"
    :icon-name="iconName"
    :link="link"
    :text="text"
  />
</template>
