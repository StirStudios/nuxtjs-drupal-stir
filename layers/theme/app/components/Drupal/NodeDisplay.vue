<script setup lang="ts">
import type { NodeDefaultProps } from '~/types'
import { usePageContext } from '~/composables/usePageContext'

type NodeTeaserData = ReturnType<typeof useNodeTeaser>['value']

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

defineSlots<{
  hero?(): unknown
  section?(): unknown
  teaser?(props: { node: NodeDefaultProps, teaser: NodeTeaserData }): unknown
  article?(props: { node: NodeDefaultProps }): unknown
  default?(props: { node: NodeDefaultProps }): unknown
}>()

const { pageLayout } = usePageContext()
const slots = useSlots()
const teaser = useNodeTeaser(slots)
const isTeaser = computed(() => {
  const type = props.type || ''

  return props.teaserModes.some((mode) => type.includes(mode))
})
const isArticle = computed(() => !!props.isArticle)
const showHero = computed(() => pageLayout.value !== 'clear' && !isTeaser.value)

provide('renderMode', isTeaser.value ? 'teaser' : 'full')
</script>

<template>
  <slot v-if="showHero" name="hero" />

  <LazyRegionArea v-if="props.showBeforeMain" area="before_main" />

  <slot
    v-if="isTeaser && slots.teaser"
    name="teaser"
    :node="props"
    :teaser="teaser"
  />

  <LazyNodeTeaser
    v-else-if="isTeaser"
    :created="props.created"
    :edit-link="props.editLink"
    orientation="vertical"
    :teaser="teaser"
    :title="props.title"
    :url="props.path?.alias"
  />

  <slot
    v-else-if="isArticle && slots.article"
    name="article"
    :node="props"
  />

  <article v-else-if="isArticle">
    <slot name="section" />
  </article>

  <slot
    v-else-if="slots.default"
    :node="props"
  />

  <slot v-else name="section" />
</template>
