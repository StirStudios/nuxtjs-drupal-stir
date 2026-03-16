<script setup lang="ts">
import type { WebformFieldProps } from '~/types'
import { clampNumberToBounds } from '~/utils/formInputUtils'

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

  if (!Number.isFinite(value)) return undefined
  if (minValue.value === undefined) return value

  return Math.max(minValue.value, value)
})

const bounds = computed(() => ({
  min: minValue.value ?? Number.NEGATIVE_INFINITY,
  max: maxValue.value,
}))

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

  return minValue.value !== undefined ? String(minValue.value) : ''
})

const defaultValue = computed(() => {
  const rawDefault =
    props.field['#defaultValue'] ??
    props.field['#default_value'] ??
    props.field['#value']
  const numberValue = Number(rawDefault)

  if (Number.isFinite(numberValue)) {
    return clampNumberToBounds(numberValue, bounds.value)
  }

  return undefined
})

const modelValue = computed<number | undefined>({
  get() {
    const rawValue = props.state[props.fieldName]

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return defaultValue.value
    }

    const numberValue = Number(rawValue)

    if (Number.isFinite(numberValue)) {
      return clampNumberToBounds(numberValue, bounds.value)
    }

    return defaultValue.value
  },
  set(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      props.state[props.fieldName] = ''
      return
    }

    const clampedValue = clampNumberToBounds(value, bounds.value)

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
