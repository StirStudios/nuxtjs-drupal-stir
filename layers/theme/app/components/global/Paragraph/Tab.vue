<script setup lang="ts">
import { resolveHeadingTag } from '#stir/utils/headingTag'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  title?: string
  header?: string
  headerTag?: string

  editLink?: string
}>()

const headingTag = computed(() => resolveHeadingTag(props.headerTag))
const trimmedHeader = computed(() => props.header?.trim() ?? '')
</script>

<template>
  <component :is="headingTag" v-if="trimmedHeader" class="mb-4 text-lg font-semibold">
    {{ trimmedHeader }}
  </component>
  <slot name="tabContent" />
</template>
