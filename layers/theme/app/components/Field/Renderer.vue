<script setup lang="ts">
import type { Component } from 'vue'
import type { WebformFieldProps, WebformState } from '../../../types'
import { useEvaluateState } from '~/composables/useEvaluateState'
import { cleanHTML } from '~/utils/cleanHTML'

import {
  LazyFieldInput,
  LazyFieldTextarea,
  LazyFieldSelect,
  LazyFieldRadio,
  LazyFieldCheckbox,
  LazyFieldCheckboxes,
  LazyFieldDate,
  LazyFieldDateTime,
  LazyFieldAddress,
  LazyFieldProcessedText,
  LazyFieldInputNumber,
  LazyFieldInputSlider,
} from '#components'

const props = withDefaults(
  defineProps<{
    field: WebformFieldProps
    fieldName: string
    state: WebformState
    fields?: Record<string, WebformFieldProps>
    orderedFieldNames?: string[]
    bypassRelocatedFilter?: boolean
  }>(),
  {
    fields: () => ({}),
    orderedFieldNames: () => [],
  },
)

const { webform } = useAppConfig().stirTheme
const componentMap: Record<string, Component> = {
  textfield: LazyFieldInput,
  email: LazyFieldInput,
  number: LazyFieldInputNumber,
  range: LazyFieldInputSlider,
  tel: LazyFieldInput,
  textarea: LazyFieldTextarea,
  select: LazyFieldSelect,
  radio: LazyFieldRadio,
  checkbox: LazyFieldCheckbox,
  checkboxes: LazyFieldCheckboxes,
  datetime: LazyFieldDateTime,
  date: LazyFieldDate,
  address: LazyFieldAddress,
  processed_text: LazyFieldProcessedText,
}

const shouldRender = computed(() => {
  return (
    props.bypassRelocatedFilter === true || props.field['#relocated'] !== true
  )
})

const useFloatingLabels = computed(
  () => props.field['#floating_label'] ?? webform.labels.floating,
)
const resolvedFieldType = computed(() => {
  const rawType = String(props.field['#type'] ?? '').trim().toLowerCase()
  const inputType =
    props.field['#input_type'] ??
    props.field['#inputType'] ??
    props.field['#widget'] ??
    (props.field['#attributes'] as Record<string, unknown> | undefined)?.type
  const normalizedInputType = String(inputType ?? '').trim().toLowerCase()

  if (rawType === 'range') return 'range'
  if (rawType.includes('range')) return 'range'

  if (rawType === 'number' && normalizedInputType === 'range') {
    return 'range'
  }

  return rawType
})

const resolvedComponent = computed(
  () => componentMap[resolvedFieldType.value] || null,
)

const shouldShowLabel = computed(
  () =>
    props.field['#type'] !== 'checkbox' &&
    props.field['#type'] !== 'datetime' &&
    props.field['#type'] !== 'date' &&
    props.field['#type'] !== 'hidden' &&
    (resolvedFieldType.value === 'number' ||
      resolvedFieldType.value === 'range' ||
      !useFloatingLabels.value),
)

const shouldShowDescription = computed(
  () =>
    props.field['#type'] !== 'checkbox' && props.field['#type'] !== 'hidden',
)

const { visible, checked } = useEvaluateState(
  props.field['#states'] ?? {},
  props.state,
)

const descriptionContent = computed(() =>
  cleanHTML(String(props.field['#description'] ?? '')),
)
const helpContent = computed(() => cleanHTML(String(props.field['#help'] ?? '')))
const labelClass = computed(() => props.field['#class'] || '')
const fieldUi = computed(() => {
  if (
    resolvedFieldType.value === 'checkbox' ||
    resolvedFieldType.value === 'checkboxes'
  ) {
    return {
      label: labelClass.value,
      error: 'mt-1 ms-6 text-error',
    }
  }

  return { label: labelClass.value }
})
</script>

<template>
  <input
    v-if="field['#type'] === 'hidden'"
    :name="fieldName"
    type="hidden"
    :value="field['#defaultValue']"
  />

  <UFormField
    v-else-if="visible && shouldRender"
    :disabled="!checked"
    :label="shouldShowLabel ? field['#title'] : undefined"
    :name="fieldName"
    :required="!!field['#required']"
    :ui="fieldUi"
  >
    <LazyButtonModal
      v-if="field['#modal'] === true"
      :modal-id="field['#name']"
    />

    <div
      v-if="descriptionContent && shouldShowDescription"
      :class="webform.description"
      v-html="descriptionContent"
    />

    <component
      :is="resolvedComponent"
      v-if="resolvedComponent"
      :field="field"
      :field-name="fieldName"
      :floating-label="
        resolvedFieldType === 'checkbox' ||
          resolvedFieldType === 'number' ||
          resolvedFieldType === 'range'
          ? undefined
          : useFloatingLabels
      "
      :state="state"
    />

    <div v-if="helpContent" :class="webform.help" v-html="helpContent" />
  </UFormField>
</template>
