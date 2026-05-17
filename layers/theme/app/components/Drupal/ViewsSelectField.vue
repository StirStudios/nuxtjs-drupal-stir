<script setup lang="ts">
interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

const props = defineProps<{
  label: string
  items: SelectOption[]
  modelValue: string | string[]
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  searchable?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const open = ref(false)

function normalizeValue(value: unknown): string | string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item))
  }

  return String(value ?? '')
}

function onUpdate(value: unknown) {
  emit('update:modelValue', normalizeValue(value))

  nextTick(() => {
    open.value = false
  })
}
</script>

<template>
  <UFormField :label="label" :ui="{ label: 'sr-only' }">
    <USelectMenu
      v-if="searchable"
      v-model:open="open"
      :aria-label="label"
      :disabled="props.disabled"
      :items="items"
      :model-value="modelValue"
      :multiple="multiple"
      :placeholder="placeholder || label"
      :search-input="{ placeholder: `Search ${label.toLowerCase()}...` }"
      :ui="{
        base: ['min-w-35'],
      }"
      value-key="value"
      @update:model-value="onUpdate"
    />

    <USelect
      v-else
      v-model:open="open"
      :aria-label="label"
      :disabled="props.disabled"
      :items="items"
      :model-value="modelValue"
      :multiple="multiple"
      :placeholder="placeholder || label"
      :ui="{
        base: ['min-w-35'],
      }"
      value-key="value"
      @update:model-value="onUpdate"
    />
  </UFormField>
</template>
