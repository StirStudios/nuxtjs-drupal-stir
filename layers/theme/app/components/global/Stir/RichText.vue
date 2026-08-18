<!--
  Stir Rich Text

  Trusted formatted editorial copy with constrained width and presentation.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
const props = defineProps<{
  /**
   * Formatted text
   * @contentMediaType text/html
   * @formattingContext block
   */
  text?: string
  align?: 'left' | 'center' | 'right'
  width?: 'narrow' | 'standard' | 'wide' | 'full'
  spacing?: 'none' | 'compact' | 'normal' | 'generous'
  card?: boolean
  cardVariant?: 'outline' | 'solid' | 'soft' | 'subtle'
}>()

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
const alignClass = computed(() => ({
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}[props.align || 'left']))
</script>

<template>
  <ParagraphText
    :align="alignClass"
    :card="card"
    :card-variant="cardVariant"
    :spacing="spacingClass"
    :text="text"
    :width="widthClass"
  />
</template>
