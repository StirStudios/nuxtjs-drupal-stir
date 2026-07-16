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
  return [gridClasses.value, props.card ? 'relative z-10' : null].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )
})

const wrapperClasses = computed(() => {
  return [
    props.container ? themeContainer : null,
    props.card ? themeCard.base : null,
    props.classes || null,
    props.width || null,
    props.spacing || null,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0)
})
const combinedClasses = computed(() => [
  ...wrapperClasses.value,
  ...gridStyles.value,
])
</script>

<template>
  <WrapDiv v-if="props.card" :styles="wrapperClasses">
    <WrapDiv :styles="gridStyles">
      <slot />
    </WrapDiv>
    <LazyCardGradient :layout="props" />
  </WrapDiv>
  <WrapDiv v-else :styles="combinedClasses">
    <slot />
  </WrapDiv>
</template>
