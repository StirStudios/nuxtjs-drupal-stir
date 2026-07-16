<script setup lang="ts">
import DrupalViewsSelectField from './ViewsSelectField.vue'

interface ExposedFilterOption {
  label: string
  value: string
}

interface ExposedFilter {
  label: string
  queryParamName: string
  type?: string
  multiple?: boolean
  disabled?: boolean
  options: ExposedFilterOption[]
}

interface SelectItem extends ExposedFilterOption {
  disabled?: boolean
}

const props = defineProps<{
  filters: ExposedFilter[]
  values: Record<string, string | string[]>
}>()

const emit = defineEmits<{
  change: [payload: { key: string; value: string | string[] }]
}>()

const textValues = ref<Record<string, string>>({})
const textDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
const textDebounceMs = 350

function onChange(key: string, value: unknown) {
  emit('change', { key, value: value as string | string[] })
}

function normalizeTextValue(value: unknown): string {
  if (value && typeof value === 'object' && 'label' in value) {
    return String(value.label ?? '')
  }

  return String(value ?? '')
}

function onTextChange(key: string, value: unknown) {
  const normalized = normalizeTextValue(value)

  textValues.value[key] = normalized

  const existingTimer = textDebounceTimers.get(key)

  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  textDebounceTimers.set(
    key,
    setTimeout(() => {
      textDebounceTimers.delete(key)
      emit('change', { key, value: normalized })
    }, textDebounceMs),
  )
}

function getTextValue(filter: ExposedFilter): string {
  if (filter.queryParamName in textValues.value) {
    return textValues.value[filter.queryParamName] ?? ''
  }

  return getValueAsText(filter.queryParamName)
}

function getValueAsText(key: string): string {
  const value = props.values[key]

  if (Array.isArray(value)) return String(value[0] ?? '')

  return String(value ?? '')
}

function hasOptions(filter: ExposedFilter): boolean {
  return filter.options.length > 0
}

function isDateRangeFilter(filter: ExposedFilter): boolean {
  return filter.type === 'date_range'
}

function getItems(filter: ExposedFilter): SelectItem[] {
  if (filter.multiple) return filter.options

  return [
    {
      label: filter.label,
      value: `__label_${filter.queryParamName}__`,
      disabled: true,
    },
    ...filter.options,
  ]
}

watch(
  () => props.values,
  () => {
    for (const filter of props.filters) {
      if (hasOptions(filter)) {
        continue
      }

      const key = filter.queryParamName
      const externalValue = getValueAsText(key)
      const timer = textDebounceTimers.get(key)

      if (timer && textValues.value[key] !== externalValue) {
        clearTimeout(timer)
        textDebounceTimers.delete(key)
      }

      if (!textDebounceTimers.has(key)) {
        textValues.value[key] = externalValue
      }
    }
  },
  { deep: true, immediate: true },
)

onBeforeUnmount(() => {
  for (const timer of textDebounceTimers.values()) {
    clearTimeout(timer)
  }

  textDebounceTimers.clear()
})
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <template
      v-for="filter in filters"
      :key="filter.queryParamName"
    >
      <DrupalViewsSelectField
        v-if="hasOptions(filter)"
        :disabled="filter.disabled"
        :items="getItems(filter)"
        :label="filter.label"
        :model-value="
          values[filter.queryParamName] ?? (filter.multiple ? [] : '')
        "
        :multiple="filter.multiple"
        :placeholder="filter.label"
        :searchable="filter.options.length > 10"
        @update:model-value="onChange(filter.queryParamName, $event)"
      />

      <UFormField
        v-else-if="!isDateRangeFilter(filter)"
        :label="filter.label"
        :ui="{ label: 'sr-only' }"
      >
        <UInput
          :aria-label="filter.label"
          class="min-w-64"
          :disabled="filter.disabled"
          :model-value="getTextValue(filter)"
          :placeholder="filter.label"
          type="search"
          @update:model-value="onTextChange(filter.queryParamName, $event)"
        />
      </UFormField>

      <DrupalViewsDateRangeFilter
        v-else
        :disabled="filter.disabled"
        :label="filter.label"
        :model-value="values[filter.queryParamName] ?? []"
        @update:model-value="onChange(filter.queryParamName, $event)"
      />
    </template>
  </div>
</template>
