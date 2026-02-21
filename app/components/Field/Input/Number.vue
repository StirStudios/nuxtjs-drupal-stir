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

const defaultValue = computed(() => {
  const rawDefault = props.field['#defaultValue'] ?? props.field['#value']
  const numberValue = Number(rawDefault)

  if (Number.isFinite(numberValue)) return numberValue

  return undefined
})

const modelValue = computed<number | undefined>({
  get() {
    const rawValue = props.state[props.fieldName]
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
    :max="field['#max']"
    :min="field['#min']"
    :placeholder="field['#placeholder'] ? String(field['#placeholder']) : undefined"
    :step="field['#step'] || 1"
    :variant="webform.variant"
  />
</template>
