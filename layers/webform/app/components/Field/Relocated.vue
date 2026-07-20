<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '#stir/types'
import { resolveWebformBoolean } from '#stir-webform/utils/webformFieldUtils'

const props = defineProps<{
  fields: Record<string, WebformFieldProps>
  state: WebformState
  orderedFieldNames: string[]
}>()

const movedFields = computed(() =>
  props.orderedFieldNames.filter(
    (name) => resolveWebformBoolean(props.fields[name]?.['#relocated']),
  ),
)
</script>

<template>
  <FieldRenderer
    v-for="fieldName in movedFields"
    :key="fieldName"
    :bypass-relocated-filter="true"
    :field="fields[fieldName]!"
    :field-name="fieldName"
    :fields="fields"
    :ordered-field-names="orderedFieldNames"
    :state="state"
  />
</template>
