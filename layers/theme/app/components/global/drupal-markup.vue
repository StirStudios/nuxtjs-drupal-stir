<script setup lang="ts">
import { useOptimizedDrupalHtml } from '#stir/composables/useOptimizedDrupalHtml'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  content?: string
  type?: string
  hide?: boolean
  isArticle?: boolean | string
}>()
const trustedHtml = useOptimizedDrupalHtml(() => props.content)

defineSlots<{
  default(): unknown
}>()
</script>

<template>
  <slot />
  <div v-if="trustedHtml" v-html="trustedHtml" />
</template>
