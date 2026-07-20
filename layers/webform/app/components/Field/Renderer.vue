<script setup lang="ts">
import type { Component } from 'vue'
import type { WebformFieldProps, WebformState } from '#stir/types'
import { useEvaluateState } from '#stir-webform/composables/useEvaluateState'
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'
import {
  resolveWebformBoolean,
  resolveWebformFieldType,
} from '#stir-webform/utils/webformFieldUtils'

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
  LazyFieldFile,
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

const webform = useStirWebformTheme()
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
  file: LazyFieldFile,
  managed_file: LazyFieldFile,
  webform_document_file: LazyFieldFile,
  webform_image_file: LazyFieldFile,
  webform_audio_file: LazyFieldFile,
  webform_video_file: LazyFieldFile,
}

const shouldRender = computed(() => {
  return (
    props.bypassRelocatedFilter === true ||
    !resolveWebformBoolean(props.field['#relocated'])
  )
})

const useFloatingLabels = computed(
  () =>
    props.field['#floating_label'] === undefined
      ? webform.labels.floating
      : resolveWebformBoolean(props.field['#floating_label']),
)
const resolvedFieldType = computed(() => resolveWebformFieldType(props.field))

const resolvedComponent = computed(
  () => componentMap[resolvedFieldType.value] || null,
)
const resolvedComponentProps = computed(() =>
  resolvedFieldType.value === 'checkboxes'
    ? { fields: props.fields }
    : {},
)

const shouldShowLabel = computed(
  () =>
    resolvedFieldType.value !== 'checkbox' &&
    resolvedFieldType.value !== 'datetime' &&
    resolvedFieldType.value !== 'date' &&
    resolvedFieldType.value !== 'hidden' &&
    (resolvedFieldType.value === 'number' ||
      resolvedFieldType.value === 'range' ||
      !useFloatingLabels.value),
)

const shouldShowDescription = computed(
  () =>
    resolvedFieldType.value !== 'checkbox' &&
    resolvedFieldType.value !== 'hidden',
)

const { visible, checked } = useEvaluateState(
  props.field['#states'] ?? {},
  props.state,
)

const descriptionContent = computed(() =>
  trustedDrupalHtml(String(props.field['#description'] ?? '')),
)
const helpContent = computed(() =>
  trustedDrupalHtml(String(props.field['#help'] ?? '')),
)
const labelClass = computed(() => String(props.field['#class'] ?? ''))
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
    v-if="resolvedFieldType === 'hidden'"
    :name="fieldName"
    type="hidden"
    :value="field['#defaultValue']"
  />

  <UFormField
    v-else-if="visible && shouldRender"
    :disabled="!checked"
    :label="shouldShowLabel ? field['#title'] : undefined"
    :name="fieldName"
    :required="resolveWebformBoolean(field['#required'])"
    :ui="fieldUi"
  >
    <LazyButtonModal
      v-if="resolveWebformBoolean(field['#modal'])"
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
      v-bind="resolvedComponentProps"
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
