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

const layoutName = computed(() => ({
  'one-column': 'one_column',
  'two-column': 'two_column',
  'three-column': 'three_column',
  grid: 'grid',
}[props.layout || 'one-column']))
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
  <ParagraphLayout
    :card="card"
    :container="true"
    :direction="animation === 'none' ? undefined : animation"
    :grid-class="gridClass"
    :header="heading"
    :header-tag="headingLevel"
    :layout="layoutName"
    :reverse-mobile="reverseOnMobile"
    :spacing="spacingClass"
    :width="widthClass"
  >
    <template #top><slot name="top" /></template>
    <template #first>
      <div class="stir-layout-drop-region" data-empty-label="Column 1 — drop content here"><slot name="first" /></div>
    </template>
    <template #second>
      <div class="stir-layout-drop-region" data-empty-label="Column 2 — drop content here"><slot name="second" /></div>
    </template>
    <template #third>
      <div class="stir-layout-drop-region" data-empty-label="Column 3 — drop content here"><slot name="third" /></div>
    </template>
    <template #items><slot name="items" /></template>
    <template #bottom><slot name="bottom" /></template>
  </ParagraphLayout>
</template>

<style>
/*
 * Canvas wraps every external-component slot in a `display: contents`
 * element. An empty wrapper has no box, so it cannot become a visible drop
 * target. Give that actual Canvas-owned slot element physical dimensions.
 */
.stir-layout-drop-region {
  position: relative;
}

.stir-layout-drop-region > div[style*="display: contents"] {
  display: block !important;
  min-height: 6rem;
  border: 1px dashed color-mix(in srgb, currentColor 25%, transparent);
  border-radius: 0.375rem;
}

.stir-layout-drop-region:has(> div[style*="display: contents"]:empty)::before {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: color-mix(in srgb, currentColor 55%, transparent);
  font-size: 0.875rem;
  pointer-events: none;
  content: attr(data-empty-label);
}
</style>
