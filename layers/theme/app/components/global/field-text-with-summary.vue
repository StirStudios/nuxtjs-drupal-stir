<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    content?: string
    processed?: string
    value?: string
    summary?: string
  }>(),
  {
    content: '',
    processed: '',
    value: '',
    summary: '',
  },
)

const trustedHtml = computed(() =>
  trustedDrupalHtml(
    props.content || props.processed || props.value || props.summary,
  ),
)
</script>

<template>
  <slot
    :content="content"
    :processed="processed"
    :summary="summary"
    :value="value"
  >
    <div v-if="trustedHtml" v-html="trustedHtml" />
  </slot>
</template>
