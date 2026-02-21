<script setup lang="ts">
import type { WebformFieldProps } from '~/types'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const { webform } = useAppConfig().stirTheme
const isMaterial = computed(() => webform.variant === 'material')
const id = useId()
const minValue = computed(() => {
  const value = Number(props.field['#min'])

  return Number.isFinite(value) ? value : undefined
})
const maxValue = computed(() => {
  const value = Number(props.field['#max'])

  return Number.isFinite(value) ? value : undefined
})
const stepValue = computed(() => {
  const value = Number(props.field['#step'])

  return Number.isFinite(value) && value > 0 ? value : 1
})
const placeholder = computed(() => {
  const value = props.field['#placeholder']
    ? String(props.field['#placeholder']).trim()
    : ''

  if (props.floatingLabel && !isMaterial.value) return ' '

  if (value) return value

  if (minValue.value !== undefined) return String(minValue.value)

  return '0'
})

const defaultValue = computed(() => {
  const rawDefault = props.field['#defaultValue'] ?? props.field['#value']
  const numberValue = Number(rawDefault)

  if (Number.isFinite(numberValue)) return numberValue

  return minValue.value
})

const modelValue = computed<number | undefined>({
  get() {
    const rawValue = props.state[props.fieldName]

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return defaultValue.value
    }

    const numberValue = Number(rawValue)

    if (Number.isFinite(numberValue)) return numberValue

    return defaultValue.value
  },
  set(value) {
    props.state[props.fieldName] = typeof value === 'number' ? value : ''
  },
})
</script>

<template>
  <UInputNumber
    :id="id"
    v-model="modelValue"
    :class="webform.fieldInput"
    :max="maxValue"
    :min="minValue"
    :placeholder="placeholder"
    :step="stepValue"
    :variant="webform.variant"
  />
</template>
