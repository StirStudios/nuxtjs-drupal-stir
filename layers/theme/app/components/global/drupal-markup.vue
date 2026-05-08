<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  content?: string
  type?: string
  hide?: boolean
  isArticle?: boolean | string
}>()
const safeHtml = computed(() => cleanHTML(props.content ?? ''))

defineSlots<{
  default(): unknown
}>()
</script>

<template>
  <slot />
  <div v-if="safeHtml" v-html="safeHtml" />
</template>
