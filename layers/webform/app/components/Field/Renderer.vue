<script setup lang="ts">
import type { Component } from 'vue'
import type { WebformFieldProps, WebformState } from '#stir/types'
import {
  applyWebformFieldStates,
  resolveWebformFieldStates,
} from '#stir-webform/utils/webformConditions'
import { isWebformDisplayElement } from '#stir-webform/utils/webformDisplayUtils'
import {
  isCompositeField,
  isSupportedWebformField,
  takesMultipleInputs,
} from '#stir-webform/utils/webformFieldTypes'
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

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
  LazyFieldComposite,
  LazyFieldLikert,
  LazyFieldMultiple,
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
    /** Validation path, when it differs from fieldName (composite parts). */
    formName?: string
  }>(),
  {
    fields: () => ({}),
    orderedFieldNames: () => [],
    formName: undefined,
  },
)

const webform = useStirWebformTheme()
const componentMap: Record<string, Component> = {
  textfield: LazyFieldInput,
  email: LazyFieldInput,
  url: LazyFieldInput,
  time: LazyFieldInput,
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
  webform_likert: LazyFieldLikert,
  processed_text: LazyFieldProcessedText,
  webform_markup: LazyFieldProcessedText,
  file: LazyFieldFile,
  managed_file: LazyFieldFile,
  webform_document_file: LazyFieldFile,
  webform_image_file: LazyFieldFile,
  webform_audio_file: LazyFieldFile,
  webform_video_file: LazyFieldFile,
}

const materialTextFieldTypes = new Set([
  'textfield',
  'email',
  'number',
  'tel',
  'url',
  'time',
  'textarea',
])

const shouldRender = computed(() => {
  return (
    props.bypassRelocatedFilter === true ||
    props.field['#relocated'] !== true
  )
})

// Conditions decide visibility and whether the field is required or
// disabled, as Drupal will when it validates the submission.
const fieldStates = computed(() => resolveWebformFieldStates(props.field, props.state))
const visible = computed(() => fieldStates.value.visible)
const disabled = computed(() => fieldStates.value.disabled)
const effectiveField = computed(() => applyWebformFieldStates(props.field, fieldStates.value))

if (!isSupportedWebformField(props.field)) {
  console.error(`[stir-webform] ${props.fieldName}: the Webform element type ${props.field['#type']} has no field component, so it is not shown and Drupal alone validates it.`)
}

const useFloatingLabels = computed(
  () =>
    props.field['#floatingLabel'] === undefined
      ? webform.labels.floating
      : props.field['#floatingLabel'],
)
const resolvedFieldType = computed(() => props.field['#type'])
const isDisplayElement = computed(() => isWebformDisplayElement(props.field))

const resolvedComponent = computed(() => {
  if (isCompositeField(props.field) && resolvedFieldType.value !== 'address') {
    return LazyFieldComposite
  }

  return componentMap[resolvedFieldType.value] || null
})
const isMultipleInput = computed(() => takesMultipleInputs(props.field))
const resolvedComponentProps = computed(() =>
  resolvedFieldType.value === 'checkboxes'
    ? { fields: props.fields }
    : {},
)

const shouldShowLabel = computed(
  () =>
    resolvedFieldType.value !== 'checkbox' &&
    resolvedFieldType.value !== 'datetime' &&
    resolvedFieldType.value !== 'hidden' &&
    !isDisplayElement.value &&
    (resolvedFieldType.value === 'checkboxes' ||
      resolvedFieldType.value === 'number' ||
      resolvedFieldType.value === 'range' ||
      !useFloatingLabels.value),
)

const shouldShowDescription = computed(
  () =>
    resolvedFieldType.value !== 'checkbox' &&
    resolvedFieldType.value !== 'hidden',
)

const descriptionContent = computed(() =>
  trustedDrupalHtml(String(props.field['#description'] ?? '')),
)
const helpContent = computed(() =>
  trustedDrupalHtml(String(props.field['#help'] ?? '')),
)
const labelClass = computed(() => String(props.field['#class'] ?? ''))
const fieldContainerClass = computed(() => {
  if (
    (resolvedFieldType.value === 'checkboxes' ||
      resolvedFieldType.value === 'radio') &&
    shouldShowLabel.value
  ) {
    return 'mt-2'
  }

  if (
    webform.fieldVariant === 'material' &&
    materialTextFieldTypes.has(resolvedFieldType.value) &&
    !useFloatingLabels.value
  ) {
    return '-mt-0.5'
  }

  return undefined
})
const fieldUi = computed(() => {
  if (
    resolvedFieldType.value === 'checkbox' ||
    resolvedFieldType.value === 'checkboxes'
  ) {
    return {
      container: fieldContainerClass.value,
      label: labelClass.value,
      error: 'mt-1 ms-6 text-error',
    }
  }

  return {
    container: fieldContainerClass.value,
    label: labelClass.value,
  }
})
</script>

<template>
  <input
    v-if="resolvedFieldType === 'hidden'"
    :name="fieldName"
    type="hidden"
    :value="effectiveField['#defaultValue']"
  />

  <template
    v-else-if="visible && shouldRender && isDisplayElement && resolvedComponent"
  >
    <LazyButtonModal
      v-if="effectiveField['#modal']"
      :modal-id="effectiveField['#name']"
    />

    <div
      v-if="descriptionContent && shouldShowDescription"
      :class="webform.description"
      v-html="descriptionContent"
    />

    <component
      :is="resolvedComponent"
      v-bind="resolvedComponentProps"
      :field="effectiveField"
      :field-name="fieldName"
      :state="state"
    />

    <div v-if="helpContent" :class="webform.help" v-html="helpContent" />
  </template>

  <UFormField
    v-else-if="visible && shouldRender && resolvedComponent"
    :label="shouldShowLabel ? effectiveField['#title'] : undefined"
    :name="formName ?? fieldName"
    :required="effectiveField['#required']"
    :ui="fieldUi"
  >
    <LazyButtonModal
      v-if="effectiveField['#modal']"
      :modal-id="effectiveField['#name']"
    />

    <div
      v-if="descriptionContent && shouldShowDescription"
      :class="webform.description"
      v-html="descriptionContent"
    />

    <LazyFieldMultiple
      v-if="isMultipleInput"
      :component="resolvedComponent"
      :field="effectiveField"
      :field-name="fieldName"
      :state="state"
    />
    <component
      :is="resolvedComponent"
      v-else
      v-bind="resolvedComponentProps"
      :disabled="resolvedFieldType === 'select' ? disabled : undefined"
      :field="effectiveField"
      :field-name="fieldName"
      :floating-label="
        resolvedFieldType === 'checkbox' ||
          resolvedFieldType === 'checkboxes' ||
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
