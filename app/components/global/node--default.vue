<script setup lang="ts">
import { usePageContext } from '~/composables/usePageContext'

const { pageLayout } = usePageContext()

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  title: string
  type?: string
  isArticle?: boolean | string
  created: string
  uid?: string | object
  hide?: boolean | string

  path?: {
    alias: string
    pid: string
    langcode: string
  }

  related?: {
    prevNode?: {
      nid: string
      title: string
      url: string
    } | null
    nextNode?: {
      nid: string
      title: string
      url: string
    } | null
  }
}>()

defineSlots<{
  hero?(): unknown
  section?(): unknown
}>()

const slots = useSlots()
const teaser = useNodeTeaser(slots)
const isTeaser = computed(() => props.type?.includes('teaser'))
const isArticle = computed(() => !!props.isArticle)
const showHero = computed(() => pageLayout.value !== 'clear' && !isTeaser.value)
</script>

<template>
  <slot v-if="showHero" name="hero" />

  <LazyRegionArea area="before_main" />

  <LazyNodeTeaser
    v-if="isTeaser"
    :created="props.created"
    orientation="vertical"
    :teaser="teaser"
    :title="props.title"
    :url="props.path?.alias"
  />

  <article v-else-if="isArticle">
    <slot name="section" />
  </article>

  <slot v-else name="section" />
</template>
