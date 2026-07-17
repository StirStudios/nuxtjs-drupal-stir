<script setup lang="ts">
import DrupalViewsSelectField from './ViewsSelectField.vue'
import DrupalViewsSearchField from './ViewsSearchField.vue'

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

function onChange(key: string, value: unknown) {
  emit('change', { key, value: value as string | string[] })
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

      <DrupalViewsSearchField
        v-else-if="!isDateRangeFilter(filter)"
        class="min-w-64"
        :disabled="filter.disabled"
        :label="filter.label"
        :model-value="getValueAsText(filter.queryParamName)"
        :placeholder="filter.label"
        @update:model-value="onChange(filter.queryParamName, $event)"
      />

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
