<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  label: string
  items: SelectOption[]
  modelValue: string | string[]
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  searchable?: boolean
  searchPlaceholder?: string
}>(), {
  disabled: false,
  multiple: false,
  placeholder: undefined,
  searchable: false,
  searchPlaceholder: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const open = ref(false)
const resolvedPlaceholder = computed(() => props.placeholder || props.label)
const shouldUseSearchableSelect = computed(() => props.searchable || props.items.length > 10)
const searchInput = computed(() => ({
  placeholder: props.searchPlaceholder || `Search ${props.label.toLowerCase()}...`,
}))
const selectUi = {
  base: 'min-w-35',
  content: 'w-max min-w-[var(--reka-select-trigger-width,var(--reka-combobox-trigger-width))] max-w-[calc(100vw-2rem)]',
  itemLabel: 'overflow-visible whitespace-nowrap text-clip',
} as const

function optionValue(value: unknown): string {
  if (value && typeof value === 'object' && 'value' in value) {
    return String(value.value ?? '')
  }

  return String(value ?? '')
}

function normalizeArrayValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(optionValue).filter(Boolean)
  }

  if (value instanceof Set) {
    return [...value].map(optionValue).filter(Boolean)
  }

  const stringValue = optionValue(value)

  return stringValue.includes(',')
    ? stringValue.split(',').map(item => item.trim()).filter(Boolean)
    : [stringValue].filter(Boolean)
}

function normalizeValue(value: unknown): string | string[] {
  return Array.isArray(value) || value instanceof Set
    ? normalizeArrayValue(value)
    : optionValue(value)
}

function normalizeMultipleValue(value: unknown): string[] {
  const nextValues = normalizeArrayValue(value)

  if (Array.isArray(value) || value instanceof Set || nextValues.length > 1) {
    return nextValues
  }

  const currentValues = Array.isArray(props.modelValue)
    ? props.modelValue.map(optionValue).filter(Boolean)
    : [String(props.modelValue || '')].filter(Boolean)
  const nextValue = nextValues[0]

  if (!nextValue) return currentValues

  return currentValues.includes(nextValue)
    ? currentValues.filter(item => item !== nextValue)
    : [...currentValues, nextValue]
}

function onUpdate(value: unknown) {
  emit(
    'update:modelValue',
    props.multiple ? normalizeMultipleValue(value) : normalizeValue(value),
  )

  nextTick(() => {
    open.value = false
  })
}
</script>

<template>
  <UFormField :label="label" :ui="{ label: 'sr-only' }">
    <USelectMenu
      v-if="shouldUseSearchableSelect"
      v-bind="$attrs"
      v-model:open="open"
      :aria-label="label"
      :disabled="props.disabled"
      :items="items"
      :model-value="modelValue"
      :multiple="multiple"
      :placeholder="resolvedPlaceholder"
      :search-input="searchInput"
      :ui="selectUi"
      value-key="value"
      @update:model-value="onUpdate"
    />

    <USelect
      v-else
      v-bind="$attrs"
      v-model:open="open"
      :aria-label="label"
      :disabled="props.disabled"
      :items="items"
      :model-value="modelValue"
      :multiple="multiple"
      :placeholder="resolvedPlaceholder"
      :ui="selectUi"
      value-key="value"
      @update:model-value="onUpdate"
    />
  </UFormField>
</template>
