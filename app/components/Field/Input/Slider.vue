<script setup lang="ts">
import type { WebformFieldProps } from '~/types'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const { webform } = useAppConfig().stirTheme
const id = useId()
const minimumAllowedValue = 1

const getDefaultValue = () => {
  const rawDefault = props.field['#defaultValue'] ?? props.field['#value']
  const numberValue = Number(rawDefault)

  if (Number.isFinite(numberValue)) return numberValue

  const minValue = Number(props.field['#min'])

  return Number.isFinite(minValue) ? Math.max(minimumAllowedValue, minValue) : minimumAllowedValue
}

const modelValue = computed<number>({
  get() {
    const rawValue = props.state[props.fieldName]

    if (
      rawValue === '' ||
      rawValue === null ||
      rawValue === undefined
    ) {
      return getDefaultValue()
    }

    const numberValue = Number(rawValue)

    if (Number.isFinite(numberValue)) return numberValue

    return getDefaultValue()
  },
  set(value) {
    const minValue = Number(props.field['#min'])
    const maxValue = Number(props.field['#max'])
    const normalizedMin = Number.isFinite(minValue)
      ? Math.max(minimumAllowedValue, minValue)
      : minimumAllowedValue
    const normalizedMax = Number.isFinite(maxValue)
      ? Math.max(normalizedMin, maxValue)
      : undefined

    props.state[props.fieldName] = normalizedMax === undefined
      ? Math.max(normalizedMin, value)
      : Math.min(normalizedMax, Math.max(normalizedMin, value))
  },
})

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
</script>

<template>
  <div class="space-y-3">
    <USlider
      :id="id"
      v-model="modelValue"
      :class="webform.fieldInput"
      :max="maxValue"
      :min="minValue"
      :step="stepValue"
      tooltip
    />

    <div class="text-default/80 flex items-center justify-between text-xs">
      <span v-if="minValue !== undefined">{{ minValue }}</span>
      <span v-else />
      <span class="text-default font-medium">Selected: {{ modelValue }}</span>
      <span v-if="maxValue !== undefined">{{ maxValue }}</span>
      <span v-else />
    </div>
  </div>
</template>
