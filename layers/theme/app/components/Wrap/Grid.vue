<script setup lang="ts">
import { tv } from '@nuxt/ui/utils/tv'
import { resolveGridClasses, resolveWidthClasses, type AlignConfig, type GridConfig } from '#stir/utils/gridClasses'

const props = defineProps<{
  align?: AlignConfig
  classes?: string
  spacing?: string
  gridItems?: GridConfig
  container?: boolean
  width?: string
  card?: boolean
}>()

defineSlots<{ default(): unknown }>()

const { container: themeContainer, card: themeCard } = useAppConfig().stirTheme
const gridStyles = computed(() => {
  return [resolveGridClasses(props.gridItems), props.card ? 'relative z-10' : null].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )
})

const containerAlignment = computed(() => {
  if (props.align?.justify === 'start') return 'mx-0 ms-0 me-auto'
  if (props.align?.justify === 'end') return 'mx-0 ms-auto me-0'
  return props.align?.justify === 'center' ? 'mx-auto' : ''
})
const contentWrapperClasses = computed(() => {
  return [
    props.container ? 'mx-auto' : null,
    props.classes || null,
    resolveWidthClasses(props.width, props.align) || null,
    props.spacing || null,
    containerAlignment.value,
    // The paragraph's text alignment, as Text paragraphs apply their own.
    props.align?.text ? `text-${props.align.text}` : null,
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
