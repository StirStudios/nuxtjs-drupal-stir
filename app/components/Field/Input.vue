<script setup lang="ts">
import type { WebformFieldProps } from '../../../types'
import {
  formatTelDisplayValue,
  shouldPreventTelBeforeInput,
  shouldPreventTelKeydown,
  telPattern,
} from '~/utils/formInputUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const { webform } = useAppConfig().stirTheme
const isMaterial = computed(() => webform.variant === 'material')
const id = useId()
const isNumber = computed(() => props.field['#type'] === 'number')
const isTel = computed(() => props.field['#type'] === 'tel')
const fieldPlaceholder = computed(() => {
  const value = props.field['#placeholder']

  return typeof value === 'string' ? value : ''
})
const inputPlaceholder = computed(() => {
  if (props.floatingLabel) return ' '
  if (fieldPlaceholder.value) return fieldPlaceholder.value

  return ''
})
const inputAutocomplete = computed(() => {
  const value = props.field['#autocomplete']

  if (typeof value === 'string' && value.length) return value

  return isTel.value ? 'tel' : undefined
})
const inputPattern = computed(() => {
  const value = props.field['#pattern']

  if (typeof value === 'string' && value.length) return value

  return isTel.value ? telPattern : undefined
})
const inputType = computed(() => {
  const rawType = String(props.field['#type'] ?? 'text')

  return rawType === 'textfield' ? 'text' : rawType
})

function handleTelBeforeInput(event: InputEvent): void {
  if (!isTel.value) return
  if (shouldPreventTelBeforeInput(event.data)) {
    event.preventDefault()
  }
}

function handleTelKeydown(event: KeyboardEvent): void {
  if (!isTel.value) return
  if (
    shouldPreventTelKeydown(event.key, {
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
    })
  ) {
    event.preventDefault()
  }
}

function updateFieldValue(value: string | number | null | undefined): void {
  if (isTel.value) {
    props.state[props.fieldName] = formatTelDisplayValue(value)
    return
  }

  props.state[props.fieldName] = value ?? ''
}
</script>

<template>
  <UInput
    :id="id"
    :autocomplete="inputAutocomplete"
    :class="webform.fieldInput"
    :inputmode="isTel ? 'tel' : undefined"
    :max="isNumber ? field['#max'] : undefined"
    :min="isNumber ? field['#min'] : undefined"
    :model-value="state[fieldName]"
    :pattern="inputPattern"
    :placeholder="inputPlaceholder"
    :step="isNumber ? field['#step'] || 1 : undefined"
    :type="inputType"
    :ui="floatingLabel ? { base: 'peer' } : {}"
    :variant="webform.variant"
    @beforeinput="handleTelBeforeInput"
    @keydown="handleTelKeydown"
    @update:model-value="updateFieldValue"
  >
    <label
      v-if="floatingLabel"
      :class="[isMaterial ? '' : 'px-1.5', webform.labels.base]"
      :for="id"
    >
      <span :class="[isMaterial ? '' : 'px-1', 'bg-default inline-flex']">
        {{ field['#title'] }}
      </span>
    </label>
  </UInput>
</template>
