<!--
  Stir Carousel

  A governed carousel or marquee whose editable children live in its items slot.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
withDefaults(defineProps<{
  heading?: string
  presentation?: 'carousel' | 'marquee'
  gridItems?: 'one' | 'two' | 'three' | 'four' | 'five'
  width?: 'narrow' | 'standard' | 'wide' | 'full'
  spacing?: 'none' | 'compact' | 'normal' | 'generous'
  arrows?: boolean
  indicators?: boolean
  autoplay?: boolean
  interval?: number
  /** Images selected and reordered through Drupal's Media Library. */
  images?: CanvasImage[]
}>(), {
  arrows: true,
  autoplay: false,
  gridItems: 'three',
  heading: undefined,
  images: () => [],
  indicators: false,
  interval: 5000,
  presentation: 'carousel',
  spacing: 'normal',
  width: 'wide',
})

defineSlots<{
  items?(): unknown
}>()

const gridClasses: Record<string, string> = {
  one: 'basis-full gap-4',
  two: 'basis-full gap-4 md:basis-1/2',
  three: 'basis-full gap-4 md:basis-1/2 lg:basis-1/3 lg:gap-6',
  four: 'basis-1/2 gap-4 lg:basis-1/4 lg:gap-6',
  five: 'basis-1/2 gap-4 md:basis-1/3 lg:basis-1/5 lg:gap-6',
}

</script>

<template>
  <ParagraphCarousel
    :carousel-arrows="arrows"
    :carousel-autoscroll="autoplay"
    :carousel-indicators="indicators"
    :carousel-interval="interval"
    :grid-items="gridClasses[gridItems]"
    :header="heading"
    header-tag="h2"
    :presentation="presentation"
    :spacing="spacing"
    :width="width"
  >
    <template #items>
      <img
        v-for="item in images"
        :key="item.src"
        :alt="item.alt || ''"
        class="block h-auto max-w-full"
        :height="item.height"
        loading="lazy"
        :src="item.src"
        :width="item.width"
      >
      <slot name="items" />
    </template>
  </ParagraphCarousel>
</template>
