<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { inputIdInjectionKey } from '@nuxt/ui/composables/useFormField'
import {
  formatTelDisplayValue,
  shouldPreventTelBeforeInput,
  shouldPreventTelKeydown,
  telPattern,
} from '#stir/utils/formInputUtils'
import { resolveUiFieldVariant } from '#stir/utils/nuxtUiProps'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const webform = useStirWebformTheme()
const isMaterial = computed(() => webform.fieldVariant === 'material')
const inputUi = computed(() => props.floatingLabel
  ? { base: ['peer', isMaterial.value ? 'pt-4!' : ''] }
  : {})
const fieldVariant = computed(() => resolveUiFieldVariant(webform.fieldVariant))
const injectedInputId = inject(inputIdInjectionKey, undefined)
const fallbackId = useId()
const id = computed(() => injectedInputId?.value ?? fallbackId)
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
    :class="[webform.fieldInput, webform.fieldText]"
    :inputmode="isTel ? 'tel' : undefined"
    :max="isNumber ? field['#max'] : undefined"
    :min="isNumber ? field['#min'] : undefined"
    :model-value="state[fieldName]"
    :pattern="inputPattern"
    :placeholder="inputPlaceholder"
    :step="isNumber ? field['#step'] || 1 : undefined"
    :type="inputType"
    :ui="inputUi"
    :variant="fieldVariant"
    @beforeinput="handleTelBeforeInput"
    @keydown="handleTelKeydown"
    @update:model-value="updateFieldValue"
  >
    <label
      v-if="floatingLabel"
      :class="['px-1.5', webform.labels.base]"
      :for="id"
    >
      <span class="inline-flex rounded-sm bg-default pe-1">
        {{ field['#title'] }}
      </span>
    </label>
  </UInput>
</template>
