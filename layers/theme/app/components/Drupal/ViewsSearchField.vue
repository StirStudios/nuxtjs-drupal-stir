<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  debounceMs?: number
  disabled?: boolean
  label?: string
  minLength?: number
  modelValue?: string
  placeholder?: string
}>(), {
  debounceMs: 350,
  disabled: false,
  label: 'Search',
  minLength: 2,
  modelValue: '',
  placeholder: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputValue = ref(props.modelValue)
let searchTimer: ReturnType<typeof setTimeout> | undefined

function clearSearchTimer(): void {
  if (!searchTimer) return

  clearTimeout(searchTimer)
  searchTimer = undefined
}

function normalizedSearchValue(value: string): string {
  const trimmed = value.trim()

  return trimmed.length >= props.minLength ? value : ''
}

function emitSearch(value: string): void {
  const nextValue = normalizedSearchValue(value)

  if (nextValue !== props.modelValue) {
    emit('update:modelValue', nextValue)
  }
}

function onUpdate(value: unknown): void {
  inputValue.value = String(value ?? '')
  clearSearchTimer()

  if (!inputValue.value.trim()) {
    emitSearch('')
    return
  }

  searchTimer = setTimeout(() => {
    emitSearch(inputValue.value)
  }, props.debounceMs)
}

watch(() => props.modelValue, (value) => {
  if (value !== inputValue.value) {
    inputValue.value = value
  }
})

onScopeDispose(clearSearchTimer)
</script>

<template>
  <UFormField :label="label" :ui="{ label: 'sr-only' }">
    <UInput
      v-bind="$attrs"
      :aria-label="label"
      class="w-full sm:w-48"
      :disabled="disabled"
      icon="i-lucide-search"
      :model-value="inputValue"
      :placeholder="placeholder || label"
      type="search"
      @update:model-value="onUpdate"
    />
  </UFormField>
</template>
