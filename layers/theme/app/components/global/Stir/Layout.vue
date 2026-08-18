<!--
  Stir Layout

  A bounded responsive layout with named regions and semantic spacing.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
const props = withDefaults(defineProps<{
  heading?: string
  headingLevel?: 'h2' | 'h3' | 'h4'
  layout?: 'one-column' | 'two-column' | 'three-column' | 'grid'
  width?: 'narrow' | 'standard' | 'wide' | 'full'
  spacing?: 'none' | 'compact' | 'normal' | 'generous'
  card?: boolean
  reverseOnMobile?: boolean
  animation?: 'none' | 'fade' | 'fade-up' | 'fade-down'
}>(), {
  layout: 'three-column',
  width: 'wide',
  spacing: 'normal',
})

defineSlots<{
  top?(): unknown
  first?(): unknown
  second?(): unknown
  third?(): unknown
  items?(): unknown
  bottom?(): unknown
}>()

const gridClass = computed(() => ({
  'one-column': 'grid grid-cols-1 gap-6',
  'two-column': 'grid grid-cols-1 gap-6 lg:grid-cols-2',
  'three-column': 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
  grid: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
}[props.layout || 'one-column']))
const widthClass = computed(() => ({
  narrow: 'w-prose',
  standard: 'w-lg',
  wide: 'w-xl',
  full: 'w-full',
}[props.width || 'standard']))
const spacingClass = computed(() => ({
  none: '',
  compact: 'py-4',
  normal: 'py-8',
  generous: 'py-16',
}[props.spacing || 'normal']))
</script>

<template>
  <section :class="['content', spacingClass]">
    <WrapGrid
      :card="card"
      :container="true"
      :grid-items="gridClass"
      :width="widthClass"
    >
      <component
        :is="headingLevel || 'h2'"
        v-if="heading"
        class="col-span-full"
      >
        {{ heading }}
      </component>

      <div class="region top col-span-full"><slot name="top" /></div>
      <div class="region first stir-layout-drop-region">
        <slot name="first" />
      </div>
      <div class="region second stir-layout-drop-region">
        <slot name="second" />
      </div>
      <div class="region third stir-layout-drop-region">
        <slot name="third" />
      </div>
      <div class="region items"><slot name="items" /></div>
      <div class="region bottom col-span-full"><slot name="bottom" /></div>
    </WrapGrid>
  </section>
</template>

<style>
/*
 * Canvas wraps every external-component slot in a `display: contents`
 * element. An empty wrapper has no box, so it cannot become a visible drop
 * target. Give that actual Canvas-owned slot element physical dimensions.
 */
.stir-layout-drop-region > div[style*="display: contents"] {
  display: block !important;
  min-height: 6rem;
  border: 1px dashed color-mix(in srgb, currentColor 25%, transparent);
  border-radius: 0.375rem;
}
</style>
