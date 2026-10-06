<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '#stir/types'

// An address is a composite like any other; this keeps FieldAddress
// available to sites that override it.
defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
}>()
</script>

<template>
  <FieldComposite :field="field" :field-name="fieldName" :state="state" />
</template>
