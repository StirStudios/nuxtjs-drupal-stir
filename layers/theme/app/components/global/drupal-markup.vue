<script setup lang="ts">
import { trustedDrupalHtml } from '~/utils/trustedDrupalHtml'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  content?: string
  type?: string
  hide?: boolean
  isArticle?: boolean | string
}>()
const trustedHtml = computed(() => trustedDrupalHtml(props.content))

defineSlots<{
  default(): unknown
}>()
</script>

<template>
  <slot />
  <div v-if="trustedHtml" v-html="trustedHtml" />
</template>
