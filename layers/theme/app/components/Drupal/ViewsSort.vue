<script setup lang="ts">
interface SortOption {
  label: string
  value: string
}

const props = defineProps<{
  sortByKey?: string
  sortOrderKey?: string
  sortByLabel?: string
  sortOrderLabel?: string
  sortByOptions: SortOption[]
  sortOrderOptions: SortOption[]
  values: Record<string, string | string[]>
}>()

const emit = defineEmits<{
  change: [payload: { key: string; value: string }]
}>()

const controls = computed(() => {
  const items: Array<{
    key: string
    label: string
    placeholder: string
    options: SortOption[]
  }> = []

  if (props.sortByKey && props.sortByOptions.length > 1) {
    const label =
      props.sortByLabel || props.sortByOptions[0]?.label || 'Sort by'

    items.push({
      key: props.sortByKey,
      label,
      placeholder: label,
      options: props.sortByOptions,
    })
  }

  if (props.sortOrderKey && props.sortOrderOptions.length > 0) {
    const label = props.sortOrderLabel || 'Sort order'

    items.push({
      key: props.sortOrderKey,
      label,
      placeholder: label,
      options: props.sortOrderOptions,
    })
  }

  return items
})

function onChange(key: string | undefined, value: unknown) {
  if (!key) return
  emit('change', { key, value: String(value ?? '') })
}
</script>

<template>
  <div class="flex items-end gap-3">
    <DrupalViewsSelectField
      v-for="control in controls"
      :key="control.key"
      :items="control.options"
      :label="control.label"
      :model-value="values[control.key] ?? ''"
      :placeholder="control.placeholder"
      @update:model-value="onChange(control.key, $event)"
    />
  </div>
</template>
