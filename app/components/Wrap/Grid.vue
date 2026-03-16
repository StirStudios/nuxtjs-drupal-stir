<script setup lang="ts">
const props = defineProps<{
  classes?: string
  gridClasses?: string
  spacing?: string
  gridItems?: string
  container?: boolean
  width?: string
  card?: boolean
}>()

defineSlots<{ default(): unknown }>()

const { container: themeContainer, card: themeCard } = useAppConfig().stirTheme
const gridClasses = computed(() => props.gridItems || props.gridClasses)
const gridStyles = computed(() => {
  return [gridClasses.value, props.card ? 'relative z-10' : null].filter(Boolean)
})

const wrapperClasses = computed(() => {
  return [
    props.container ? themeContainer : null,
    props.card ? themeCard.base : null,
    props.classes || null,
    props.width || null,
    props.spacing || null,
  ].filter(Boolean)
})
</script>

<template>
  <WrapDiv :styles="wrapperClasses">
    <WrapDiv :styles="gridStyles">
      <slot />
    </WrapDiv>
    <CardGradient v-if="props.card" :layout="props" />
  </WrapDiv>
</template>
