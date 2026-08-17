<!--
  Stir Media Collection

  A responsive media region populated through its media slot.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
const props = defineProps<{
  heading?: string
  headingLevel?: 'h2' | 'h3' | 'h4'
  align?: 'left' | 'center' | 'right'
  columns?: 'one' | 'two' | 'three' | 'four'
  overlay?: boolean
  randomize?: boolean
}>()

defineSlots<{
  media?(): unknown
}>()

const gridItems = computed(() => ({
  one: 'grid-cols-1',
  two: 'grid-cols-1 md:grid-cols-2',
  three: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  four: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}[props.columns || 'one']))
const alignClass = computed(() => ({
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}[props.align || 'left']))
</script>

<template>
  <ParagraphMedia
    :align="alignClass"
    :grid-items="gridItems"
    :header="heading"
    :header-tag="headingLevel"
    :overlay="overlay"
    :randomize="randomize"
  >
    <template #media><slot name="media" /></template>
  </ParagraphMedia>
</template>
