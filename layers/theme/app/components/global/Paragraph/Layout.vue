<script setup lang="ts">
import { slugify } from '#stir/utils/stringUtils'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import {
  provideRevealMotionScope,
  useRevealMotionScope,
} from '#stir/composables/useRevealMotionScope'
import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import {
  layoutImageDeliveryProfileKey,
  resolveLayoutImageDeliveryProfile,
} from '#stir/utils/imageDelivery'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  layout?: string
  container?: boolean
  card?: boolean

  label?: string
  header?: string
  headerTag?: string

  width?: string
  spacing?: string
  gridClass?: string
  classes?: string
  regionAlign?: Record<string, string>
  reverseMobile?: boolean

  randomize?: boolean
  direction?: string
  animationScope?: 'children' | 'layout'
  animationStagger?: boolean | number | string
  editLink?: string
}>()

const vueSlots = useSlots()
const orderedSlots = computed(() => Object.entries(vueSlots))
const isGridLayout = computed(
  () => props.layout === 'grid' || props.layout?.startsWith('grid_col') === true,
)
const hasGridItems = computed(() => isGridLayout.value && Boolean(vueSlots.items))
const imageDeliveryProfile = computed(() =>
  resolveLayoutImageDeliveryProfile(
    props.layout,
    [props.gridClass, props.width].filter(Boolean).join(' '),
  ),
)
const reversesTwoColumnMobileStack = computed(
  () => props.reverseMobile === true && props.layout?.startsWith('two_column') === true,
)
const mobileRegionOrderClass = (slotName: string) => {
  if (!reversesTwoColumnMobileStack.value) return ''

  return {
    top: 'order-0 lg:order-none',
    second: 'order-1 lg:order-none',
    first: 'order-2 lg:order-none',
    bottom: 'order-3 lg:order-none',
  }[slotName] ?? ''
}
const sectionId = computed(() => {
  if (props.label) return slugify(props.label)
  return `section-${props.id ?? 'unknown'}`
})
const animationScope = computed(() => props.animationScope || 'children')
const { effect: resolvedLayoutEffect, staggerIndex } =
  useRevealMotionScope(() => props.direction)
const { getRevealDelayMs, revealMotionKey, useRevealMotionProps } =
  useRevealMotionConfig()
const layoutMotionProps = useRevealMotionProps(
  () => animationScope.value === 'layout'
    ? resolvedLayoutEffect.value
    : undefined,
  () => getRevealDelayMs(staggerIndex.value),
)
const headerMotionProps = useRevealMotionProps(
  () => animationScope.value === 'children'
    ? resolvedLayoutEffect.value
    : undefined,
  () => getRevealDelayMs(staggerIndex.value),
)

provideRevealMotionScope(
  () => animationScope.value === 'children'
    ? resolvedLayoutEffect.value
    : undefined,
  { stagger: () => resolveBooleanProp(props.animationStagger) },
)
provide(layoutImageDeliveryProfileKey, imageDeliveryProfile)
</script>

<template>
  <RevealMotionElement
    :id="sectionId"
    :key="`layout-${id}-${revealMotionKey}`"
    as="section"
    :class="[classes || 'content', spacing]"
    :motion-props="layoutMotionProps"
  >
    <WrapGrid
      :card="card"
      :container="container"
      :grid-items="gridClass"
      :width="width"
    >
      <RevealMotionElement
        v-if="header"
        :as="headerTag || 'h2'"
        class="col-span-full"
        :motion-props="headerMotionProps"
      >
        {{ props.header }}
      </RevealMotionElement>

      <slot v-if="hasGridItems" name="items" />

      <template v-for="[slotName] in orderedSlots" :key="slotName">
        <div
          v-if="!hasGridItems || slotName !== 'items'"
          :class="[
            'region flex-col',
            slotName,
            props.regionAlign?.[slotName],
            mobileRegionOrderClass(slotName),
            ['top', 'bottom'].includes(slotName) ? 'col-span-full' : '',
          ]"
        >
          <slot :name="slotName" />
        </div>
      </template>
    </WrapGrid>
  </RevealMotionElement>
</template>
