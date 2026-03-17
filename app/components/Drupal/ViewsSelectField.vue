<script setup lang="ts">
interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

defineProps<{
  label: string
  items: SelectOption[]
  modelValue: string | string[]
  placeholder?: string
  multiple?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

function onUpdate(value: unknown) {
  if (Array.isArray(value)) {
    emit(
      'update:modelValue',
      value.map((item) => String(item)),
    )
    return
  }

  emit('update:modelValue', String(value ?? ''))
}
</script>

<template>
  <UFormField :label="label" :ui="{ label: 'sr-only' }">
    <USelect
      :aria-label="label"
      :items="items"
      :model-value="modelValue"
      :multiple="multiple"
      :placeholder="placeholder || label"
      :ui="{
        base: ['min-w-35'],
      }"
      @update:model-value="onUpdate"
    />
  </UFormField>
</template>
