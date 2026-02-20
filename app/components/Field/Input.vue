<script setup lang="ts">
import type { WebformFieldProps } from '../../../types'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const { webform } = useAppConfig().stirTheme
const isMaterial = computed(() => webform.variant === 'material')
const id = ref(useId())
const isNumber = computed(() => props.field['#type'] === 'number')
const isTel = computed(() => props.field['#type'] === 'tel')
const inputType = computed(() => {
  const rawType = String(props.field['#type'] ?? 'text')
  return rawType === 'textfield' ? 'text' : rawType
})
</script>

<template>
  <UInput
    :id="id"
    v-model="state[fieldName]"
    :class="webform.fieldInput"
    :inputmode="isTel ? 'tel' : undefined"
    :max="isNumber ? field['#max'] : undefined"
    :min="isNumber ? field['#min'] : undefined"
    :placeholder="floatingLabel ? ' ' : ''"
    :step="isNumber ? field['#step'] || 1 : undefined"
    :type="inputType"
    :ui="floatingLabel ? { base: 'peer' } : {}"
    :variant="webform.variant"
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
