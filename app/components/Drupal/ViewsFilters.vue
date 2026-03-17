<script setup lang="ts">
interface ExposedFilterOption {
  label: string
  value: string
}

interface ExposedFilter {
  label: string
  queryParamName: string
  multiple?: boolean
  options: ExposedFilterOption[]
}

interface SelectItem extends ExposedFilterOption {
  disabled?: boolean
}

defineProps<{
  filters: ExposedFilter[]
  values: Record<string, string | string[]>
}>()

const emit = defineEmits<{
  change: [payload: { key: string; value: string | string[] }]
}>()

function onChange(key: string, value: unknown) {
  emit('change', { key, value: value as string | string[] })
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
    <DrupalViewsSelectField
      v-for="filter in filters"
      :key="filter.queryParamName"
      :items="getItems(filter)"
      :label="filter.label"
      :model-value="
        values[filter.queryParamName] ?? (filter.multiple ? [] : '')
      "
      :multiple="filter.multiple"
      :placeholder="filter.label"
      @update:model-value="onChange(filter.queryParamName, $event)"
    />
  </div>
</template>
