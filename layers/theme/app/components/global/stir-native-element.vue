<script setup lang="ts">
import { isHTMLTag, isMathMLTag, isSVGTag } from '@vue/shared'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  tag: string
}>()

const tag = computed(() =>
  isHTMLTag(props.tag) || isSVGTag(props.tag) || isMathMLTag(props.tag)
    ? props.tag
    : 'span',
)
</script>

<template>
  <component :is="tag" v-bind="$attrs">
    <slot />
  </component>
</template>
