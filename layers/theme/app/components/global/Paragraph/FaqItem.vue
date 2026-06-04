<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  header?: string
  headerTag?: string
  question?: string
  text?: string
  answer?: string

  editLink?: string
}>()

const displayQuestion = computed(() => props.question ?? props.header ?? '')
const safeAnswerHtml = computed(() => cleanHTML(props.answer ?? props.text ?? ''))
</script>

<template>
  <component
    :is="headerTag || 'h3'"
    v-if="displayQuestion"
    class="sr-only"
  >
    {{ displayQuestion }}
  </component>

  <div
    v-if="safeAnswerHtml"
    class="prose max-w-none text-muted"
    v-html="safeAnswerHtml"
  />

  <EditLink :link="editLink" :parent-uuid="parentUuid" />
</template>
