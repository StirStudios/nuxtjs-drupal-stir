<script setup lang="ts">
import type { NodeDefaultProps } from '#stir/types'
import { usePageContext } from '#stir/composables/usePageContext'
import { provideRevealMotionScope } from '#stir/composables/useRevealMotionScope'
import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import {
  carouselImageDeliverySizesKey,
  layoutImageDeliveryProfileKey,
} from '#stir/utils/imageDelivery'

const props = withDefaults(
  defineProps<NodeDefaultProps & {
    imageDeliveryProfile?: string
    showBeforeMain?: boolean
    teaserModes?: string[]
  }>(),
  {
    imageDeliveryProfile: undefined,
    showBeforeMain: true,
    teaserModes: () => ['teaser', 'listing', 'card'],
  },
)

defineOptions({
  inheritAttrs: false,
})

const { pageLayout } = usePageContext()
const slots = useSlots()
const teaser = useNodeTeaser(slots)
const isArticle = computed(() => resolveBooleanProp(props.isArticle))
const renderMode = computed<'teaser' | 'article' | 'default'>(() => {
  const type = props.type || ''

  if (props.teaserModes.some((mode) => type.includes(mode))) return 'teaser'
  if (isArticle.value) return 'article'

  return 'default'
})
const showHero = computed(() =>
  !['clear', 'links'].includes(pageLayout.value) && renderMode.value !== 'teaser',
)
// System ownership is useful payload metadata, but it is not page content.
// Keep ordinary configured node fields renderable while preventing Drupal's
// raw UID entity-reference formatter from falling through into the document.
const reservedSlotNames = new Set(['hero', 'teaser', 'article', 'default', 'uid'])
const contentSlotNames = computed(() =>
  Object.keys(slots).filter((name) => !reservedSlotNames.has(name)),
)
const theme = useAppConfig().stirTheme
const parentCarouselImageDeliverySizes = inject(
  carouselImageDeliverySizesKey,
  undefined,
)
const parentLayoutImageDeliveryProfile = inject(
  layoutImageDeliveryProfileKey,
  undefined,
)
const nestedImageDeliveryProfile = computed(() =>
  props.imageDeliveryProfile
  || parentLayoutImageDeliveryProfile?.value,
)
const nestedCarouselImageDeliverySizes = computed(() => {
  const profile = props.imageDeliveryProfile

  return profile
    ? theme.media.image.profiles[profile]
    : parentCarouselImageDeliverySizes?.value
})

provide('renderMode', renderMode.value === 'teaser' ? 'teaser' : 'full')
provide(carouselImageDeliverySizesKey, nestedCarouselImageDeliverySizes)
provide(layoutImageDeliveryProfileKey, nestedImageDeliveryProfile)
provideRevealMotionScope(
  () => props.pageAnimation,
  { stagger: () => resolveBooleanProp(props.pageAnimationStagger) },
)
</script>

<template>
  <slot v-if="showHero" name="hero" />

  <LazyRegionArea v-if="props.showBeforeMain" area="before_main" />

  <!-- Full-node editor controls are shared behavior. Custom content-type
       renderers inherit them by composing DrupalNodeDisplay. Teasers keep
       their existing control inside NodeTeaser to avoid duplicates. -->
  <EditLink
    v-if="renderMode !== 'teaser'"
    :link="props.editLink"
  />

  <slot
    v-if="renderMode === 'teaser' && slots.teaser"
    name="teaser"
    :node="props"
    :teaser="teaser"
  />

  <LazyNodeTeaser
    v-else-if="renderMode === 'teaser'"
    :created="props.created"
    :edit-link="props.editLink"
    orientation="vertical"
    :teaser="teaser"
    :title="props.title"
    :url="props.url || props.path?.alias"
  />

  <slot
    v-else-if="renderMode === 'article' && slots.article"
    name="article"
    :node="props"
  />

  <article v-else-if="renderMode === 'article'">
    <UContainer :class="[theme.article.container, 'flex justify-end py-4']">
      <ShareLinks
        :description="props.summary"
        :title="props.title"
        variant="menu"
      />
    </UContainer>

    <template v-for="slotName in contentSlotNames" :key="slotName">
      <slot :name="slotName" />
    </template>
  </article>

  <slot
    v-else-if="slots.default"
    :node="props"
  />

  <template v-else>
    <template v-for="slotName in contentSlotNames" :key="slotName">
      <slot :name="slotName" />
    </template>
  </template>
</template>
