<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
}>()

const trustedTextHtml = computed(() =>
  trustedDrupalHtml(String(props.field['#markup'] ?? props.field['#text'] ?? '')),
)
</script>

<template>
  <div
    :class="[
      'prose [&>:first-child]:mt-0! [&>:last-child]:mb-0!',
      fieldName,
    ]"
    v-html="trustedTextHtml"
  />
</template>
