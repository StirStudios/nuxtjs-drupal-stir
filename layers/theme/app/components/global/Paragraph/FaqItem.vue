<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

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
const trustedAnswerHtml = computed(() =>
  trustedDrupalHtml(props.answer ?? props.text),
)
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
    v-if="trustedAnswerHtml"
    class="prose max-w-none text-muted"
    v-html="trustedAnswerHtml"
  />

  <EditLink :link="editLink" :parent-uuid="parentUuid" />
</template>
