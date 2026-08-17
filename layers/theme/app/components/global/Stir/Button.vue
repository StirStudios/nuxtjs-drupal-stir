<!--
  Stir Button

  A governed call to action using the shared Stir button presentation.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
const props = defineProps<{
  label?: string
  url?: string
  align?: 'left' | 'center' | 'right'
  color?: 'primary' | 'neutral' | 'success' | 'error'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
  icon?: string
  block?: boolean
}>()

const link = computed(() => ({
  title: props.label || 'View link',
  url: props.url || '',
}))
const alignClass = computed(() => ({
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}[props.align || 'left']))
</script>

<template>
  <ParagraphButton
    :align="alignClass"
    :block="block"
    :color="color"
    :icon="icon"
    :link="link"
    :size="size"
    :variant="variant"
  />
</template>
