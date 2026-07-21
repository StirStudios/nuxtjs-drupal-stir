<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
}>()

const trustedTextHtml = computed(() =>
  trustedDrupalHtml(String(props.field['#text'] ?? '')),
)
</script>

<template>
  <div :class="['prose', fieldName]" v-html="trustedTextHtml" />
</template>
