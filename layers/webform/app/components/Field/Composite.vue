<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '#stir/types'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
}>()

// Parts follow the composite's floating-label choice unless they set one.
const parts = computed(() =>
  Object.entries(props.field['#composite'] ?? {}).map(([key, part]) => [
    key,
    props.field['#floatingLabel'] === undefined || part['#floatingLabel'] !== undefined
      ? part
      : { ...part, '#floatingLabel': props.field['#floatingLabel'] },
  ]) as Array<[string, WebformFieldProps]>,
)

// Webform stores a composite that takes several values, such as a custom
// composite, as a list of rows; createWebformState starts it with one row,
// and the form offers that row.
const row = computed(() => {
  const value = props.state[props.fieldName] as unknown

  return (Array.isArray(value) ? value[0] : value) as WebformState
})
const isMultiple = props.field['#multiple'] === true
const partFormName = (part: string) =>
  isMultiple ? `${props.fieldName}.0.${part}` : `${props.fieldName}.${part}`
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <FieldRenderer
      v-for="[key, part] in parts"
      :key="key"
      :field="part"
      :field-name="key"
      :form-name="partFormName(key)"
      :state="row"
    />
  </div>
</template>
