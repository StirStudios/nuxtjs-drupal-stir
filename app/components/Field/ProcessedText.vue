<script setup lang="ts">
import type { WebformFieldProps } from '../../../types'
import { cleanHTML } from '~/utils/cleanHTML'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
}>()

const safeTextHtml = computed(() => cleanHTML(String(props.field['#text'] ?? '')))
</script>

<template>
  <div :class="['prose', fieldName]" v-html="safeTextHtml" />
</template>
