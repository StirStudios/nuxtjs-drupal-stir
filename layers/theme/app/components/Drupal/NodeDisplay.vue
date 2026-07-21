<script setup lang="ts">
import type { NodeDefaultProps } from '#stir/types'
import { usePageContext } from '#stir/composables/usePageContext'

const props = withDefaults(
  defineProps<NodeDefaultProps & {
    showBeforeMain?: boolean
    teaserModes?: string[]
  }>(),
  {
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
const renderMode = computed<'teaser' | 'article' | 'default'>(() => {
  const type = props.type || ''

  if (props.teaserModes.some((mode) => type.includes(mode))) return 'teaser'
  if (props.isArticle) return 'article'

  return 'default'
})
const showHero = computed(() =>
  pageLayout.value !== 'clear' && renderMode.value !== 'teaser',
)
// System ownership is useful payload metadata, but it is not page content.
// Keep ordinary configured node fields renderable while preventing Drupal's
// raw UID entity-reference formatter from falling through into the document.
const reservedSlotNames = new Set(['hero', 'teaser', 'article', 'default', 'uid'])
const contentSlotNames = computed(() =>
  Object.keys(slots).filter((name) => !reservedSlotNames.has(name)),
)

provide('renderMode', renderMode.value === 'teaser' ? 'teaser' : 'full')
</script>

<template>
  <slot v-if="showHero" name="hero" />

  <LazyRegionArea v-if="props.showBeforeMain" area="before_main" />

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
