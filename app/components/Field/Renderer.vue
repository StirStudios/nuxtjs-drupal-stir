<script setup lang="ts">
import type { Component } from 'vue'
import type { WebformFieldProps, WebformState } from '../../../types'
import { useEvaluateState } from '~/composables/useEvaluateState'
import { cleanHTML } from '~/utils/cleanHTML'

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
  textfield: defineAsyncComponent(() => import('~/components/Field/Input.vue')),
  email: defineAsyncComponent(() => import('~/components/Field/Input.vue')),
  number: defineAsyncComponent(
    () => import('~/components/Field/Input/Number.vue'),
  ),
  range: defineAsyncComponent(
    () => import('~/components/Field/Input/Slider.vue'),
  ),
  tel: defineAsyncComponent(() => import('~/components/Field/Input.vue')),
  textarea: defineAsyncComponent(
    () => import('~/components/Field/Textarea.vue'),
  ),
  select: defineAsyncComponent(() => import('~/components/Field/Select.vue')),
  radio: defineAsyncComponent(() => import('~/components/Field/Radio.vue')),
  checkbox: defineAsyncComponent(
    () => import('~/components/Field/Checkbox.vue'),
  ),
  checkboxes: defineAsyncComponent(
    () => import('~/components/Field/Checkboxes.vue'),
  ),
  datetime: defineAsyncComponent(
    () => import('~/components/Field/DateTime.vue'),
  ),
  date: defineAsyncComponent(() => import('~/components/Field/Date.vue')),
  address: defineAsyncComponent(() => import('~/components/Field/Address.vue')),
  processed_text: defineAsyncComponent(
    () => import('~/components/Field/ProcessedText.vue'),
  ),
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
    :ui="{ label: labelClass }"
  >
    <ButtonModal v-if="field['#modal'] === true" :modal-id="field['#name']" />

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
