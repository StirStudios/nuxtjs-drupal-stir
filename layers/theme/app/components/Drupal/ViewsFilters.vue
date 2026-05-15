<script setup lang="ts">
interface ExposedFilterOption {
  label: string
  value: string
}

interface ExposedFilter {
  label: string
  queryParamName: string
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

function onTextChange(key: string, value: unknown) {
  if (value && typeof value === 'object' && 'label' in value) {
    emit('change', { key, value: String(value.label ?? '') })
    return
  }

  emit('change', { key, value: String(value ?? '') })
}

function getTextValue(filter: ExposedFilter): string {
  const value = props.values[filter.queryParamName]

  if (Array.isArray(value)) return String(value[0] ?? '')

  return String(value ?? '')
}

function hasOptions(filter: ExposedFilter): boolean {
  return filter.options.length > 0
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
        @update:model-value="onChange(filter.queryParamName, $event)"
      />

      <UFormField
        v-else
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
    </template>
  </div>
</template>
