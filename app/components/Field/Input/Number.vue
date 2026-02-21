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
const minimumAllowedValue = 1
const minValue = computed(() => {
  const value = Number(props.field['#min'])

  if (Number.isFinite(value)) return Math.max(minimumAllowedValue, value)

  return minimumAllowedValue
})
const maxValue = computed(() => {
  const value = Number(props.field['#max'])

  if (!Number.isFinite(value)) return undefined

  return Math.max(minValue.value, value)
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

  if (Number.isFinite(numberValue)) {
    return Math.max(minValue.value, numberValue)
  }

  return minValue.value
})

const modelValue = computed<number | undefined>({
  get() {
    const rawValue = props.state[props.fieldName]

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return defaultValue.value
    }

    const numberValue = Number(rawValue)

    if (Number.isFinite(numberValue)) {
      if (maxValue.value !== undefined) {
        return Math.min(maxValue.value, Math.max(minValue.value, numberValue))
      }

      return Math.max(minValue.value, numberValue)
    }

    return defaultValue.value
  },
  set(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      props.state[props.fieldName] = ''
      return
    }

    const clampedValue =
      maxValue.value !== undefined
        ? Math.min(maxValue.value, Math.max(minValue.value, value))
        : Math.max(minValue.value, value)

    props.state[props.fieldName] = clampedValue
  },
})
</script>

<template>
  <UInputNumber
    :id="id"
    v-model="modelValue"
    :class="webform.fieldInput"
    :decrement="{ size: 'sm', color: 'neutral' }"
    :increment="{ size: 'sm', color: 'neutral' }"
    :max="maxValue"
    :min="minValue"
    :placeholder="placeholder"
    :step="stepValue"
    :variant="webform.variant"
  />
</template>
