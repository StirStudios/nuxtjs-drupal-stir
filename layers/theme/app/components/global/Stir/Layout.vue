<!--
  Stir Layout

  A bounded responsive layout with named regions and semantic spacing.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
const props = defineProps<{
  heading?: string
  headingLevel?: 'h2' | 'h3' | 'h4'
  layout?: 'one-column' | 'two-column' | 'three-column' | 'grid'
  width?: 'narrow' | 'standard' | 'wide' | 'full'
  spacing?: 'none' | 'compact' | 'normal' | 'generous'
  card?: boolean
  reverseOnMobile?: boolean
  animation?: 'none' | 'fade' | 'fade-up' | 'fade-down'
}>()

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
    <template #first><slot name="first" /></template>
    <template #second><slot name="second" /></template>
    <template #third><slot name="third" /></template>
    <template #items><slot name="items" /></template>
    <template #bottom><slot name="bottom" /></template>
  </ParagraphLayout>
</template>
