<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'

const props = defineProps<{
  content?: string
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
