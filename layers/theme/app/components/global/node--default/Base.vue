<script setup lang="ts">
import { useSlots } from 'vue'
import { useNodeDefaultState, type NodeDefaultProps } from '~/composables/useNodeDefaultState'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<NodeDefaultProps>()

defineSlots<{
  hero?(): unknown
  section?(): unknown
}>()

const slots = useSlots()
const { isTeaser, isArticle, showHero, teaser } = useNodeDefaultState(props, slots)
</script>

<template>
  <slot v-if="showHero" name="hero" />

  <LazyRegionArea area="before_main" />

  <LazyNodeTeaser
    v-if="isTeaser"
    :created="props.created"
    :edit-link="props.editLink"
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
