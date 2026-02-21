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
    props.state[props.fieldName] = value
  },
})

const minValue = computed(() => {
  const value = Number(props.field['#min'])

  return Number.isFinite(value) ? value : undefined
})

const maxValue = computed(() => {
  const value = Number(props.field['#max'])

  return Number.isFinite(value) ? value : undefined
})
</script>

<template>
  <div class="space-y-3">
    <USlider
      :id="id"
      v-model="modelValue"
      :class="webform.fieldInput"
      :max="field['#max']"
      :min="field['#min']"
      :step="field['#step'] || 1"
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
