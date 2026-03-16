<script setup lang="ts">
import type { WebformFieldProps } from '~/types'
import { clampNumberToBounds, normalizeNumberBounds } from '~/utils/formInputUtils'

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
  const bounds = normalizeNumberBounds(
    props.field['#min'],
    props.field['#max'],
    minimumAllowedValue,
  )

  if (Number.isFinite(numberValue)) {
    return clampNumberToBounds(numberValue, bounds)
  }

  return bounds.min
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
    const bounds = normalizeNumberBounds(
      props.field['#min'],
      props.field['#max'],
      minimumAllowedValue,
    )

    props.state[props.fieldName] = clampNumberToBounds(value, bounds)
  },
})

const minValue = computed(() => {
  return normalizeNumberBounds(
    props.field['#min'],
    props.field['#max'],
    minimumAllowedValue,
  ).min
})

const maxValue = computed(() => {
  return normalizeNumberBounds(
    props.field['#min'],
    props.field['#max'],
    minimumAllowedValue,
  ).max
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
