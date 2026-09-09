<script setup lang="ts">
import { tv } from '@nuxt/ui/utils/tv'

const props = defineProps<{
  align?: string
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

const containerAlignment = computed(() => {
  const align = props.align?.split(/\s+/) || []

  if (align.includes('justify-start')) return 'mx-0 ms-0 me-auto'
  if (align.includes('justify-end')) return 'mx-0 ms-auto me-0'
  return align.includes('justify-center') ? 'mx-auto' : ''
})
const contentWrapperClasses = computed(() => {
  return [
    props.container ? 'mx-auto' : null,
    props.classes || null,
    props.width || null,
    props.spacing || null,
    containerAlignment.value,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0)
})
const cardUi = computed(() => ({
  root: themeCard.base,
  body: 'p-0 sm:p-0',
}))
const combinedClasses = computed(() => tv({ base: [
  ...contentWrapperClasses.value,
  ...gridStyles.value,
] })())
</script>

<template>
  <WrapDiv :styles="props.container ? themeContainer : undefined">
    <UCard
      v-if="props.card"
      :class="tv({ base: contentWrapperClasses })()"
      :ui="cardUi"
      variant="solid"
    >
      <WrapDiv :styles="gridStyles">
        <slot />
      </WrapDiv>
      <LazyCardGradient :layout="props" />
    </UCard>
    <WrapDiv v-else :styles="combinedClasses">
      <slot />
    </WrapDiv>
  </WrapDiv>
</template>
