<script setup lang="ts">
import type { WebformFieldProps } from '~/types'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const id = useId()

const getDefaultValue = () => {
  const rawDefault = props.field['#defaultValue'] ?? props.field['#value']
  const numberValue = Number(rawDefault)

  if (Number.isFinite(numberValue)) return numberValue

  const minValue = Number(props.field['#min'])

  return Number.isFinite(minValue) ? minValue : 0
}

const modelValue = computed<number>({
  get() {
    const rawValue = props.state[props.fieldName]
    const numberValue = Number(rawValue)

    if (Number.isFinite(numberValue)) return numberValue

    return getDefaultValue()
  },
  set(value) {
    props.state[props.fieldName] = value
  },
})
</script>

<template>
  <USlider
    :id="id"
    v-model="modelValue"
    :max="field['#max']"
    :min="field['#min']"
    :step="field['#step'] || 1"
    tooltip
  />
</template>
